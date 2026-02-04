#!/usr/bin/env python3
"""
RS full CSV -> compact PoC CSV (risk factors + outcomes), Sheet2-aware, robust date parsing.

Key features:
- Original RS columns are copied unchanged.
- sex_mapped, smoking_status from Sheet2 (fallback provided).
- Dates parsed from: DD-MM-YYYY, M/D/YYYY, YYYY-MM-DD, Excel serial numbers.
- Incident codes discovered from Sheet2 labels; CLI overrides; optional --force-incident-if-date-present.
- All output date-like columns formatted as DD-MM-YYYY.
- Diagnostics printed to help verify population.

Usage example:
  python rs_full_to_compact_precise_v6.py \
    --in RS_full.csv \
    --out RS_compact.csv \
    --codebook rs_cvd_variables.xlsx \
    --true-codes "inc_MI=1;inc_hf_2018=1" \
    --force-incident-if-date-present
"""

import argparse
from typing import Any, Dict, List, Optional
import pandas as pd
import numpy as np
import re
import sys

# ----------------------------
# RS column names (edit if headers differ)
# ----------------------------
COL = {
    "id": "ergoid",
    "baseline_date": "date_int_cen",
    "birth_date": "gebdatum",
    "sex": "sexe",
    "age": "age",

    # risk factors
    "sbp": "sbp",
    "dbp": "dbp",
    "hdl": "HDL_mmol",
    "ldl_priority": ["LDL_mmol_centri", "LDL_Friedewald_mmol", "LDL_Martin_mmol"],
    "tchol": "TC_mmol",
    "creat_umol": "creat_umol",
    "egfr": "GFR",
    "smoking": "smoking",

    # baseline history
    "prev_htn": "prev_HT", #Hypertension
    "prev_dm": "prev_DM",
    "prev_mi": "prev_MI",
    "prev_stroke_tia": "prev_CVATIA",
    "prev_hf": "prev_HF",

    # outcomes
    "inc_mi_flag": "inc_MI",
    "inc_mi_date_or_censor": "enddat_MI",
    "stroke_date": "stroke_date",
    "inc_hf_flag": "inc_hf_2018",
    "inc_hf_date_or_censor": "enddat_hf",

    # optional follow-up/censoring
    "death_date": "fp_mortdat",
    "last_contact_date": "fp_date_lastcontact",
    "overall_censor_date": "fp_censordate",
}

# ----------------------------
# Sheet2 loader & mapping utils
# ----------------------------
def load_sheet2_value_map(xlsx_path: Optional[str]) -> Dict[str, Dict[str, str]]:
    """Return { normalized_varname: { normalized_code_str: label_str } } from Sheet2."""
    if not xlsx_path:
        return {}
    df = pd.read_excel(xlsx_path, sheet_name="Sheet2", header=None)
    value_map: Dict[str, Dict[str, str]] = {}
    current_var: Optional[str] = None
    for _, row in df.iterrows():
        var, code, label = row[0], row[1], row[2]
        if isinstance(var, str) and var.strip().lower() in {"variable values", "variable", "value"}:
            continue
        if isinstance(var, str) and var.strip() != "":
            current_var = _norm_varname(var)
            value_map.setdefault(current_var, {})
            if pd.notna(code):
                value_map[current_var][_norm_code(code)] = "" if pd.isna(label) else str(label).strip()
        else:
            if current_var is not None and pd.notna(code):
                value_map[current_var][_norm_code(code)] = "" if pd.isna(label) else str(label).strip()
    return value_map

def _norm_varname(name: Any) -> str:
    s = str(name).strip().lower()
    return re.sub(r"[\s_]+", "", s)

def _norm_code(x: Any) -> str:
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return ""
    s = str(x).strip()
    try:
        f = float(s)
        if f.is_integer():
            return str(int(f))
        return s
    except Exception:
        return s

def resolve_var_map_for_column(value_map: Dict[str, Dict[str, str]], csv_col: str) -> Dict[str, str]:
    return value_map.get(_norm_varname(csv_col), {})

def discover_true_codes(map_for_var: Dict[str, str],
                        include_keywords: List[str],
                        fallback_code: str = "1") -> List[str]:
    """Choose codes whose label contains any keyword (case-insensitive)."""
    if not map_for_var:
        return [fallback_code]
    pos = []
    for code, label in map_for_var.items():
        lab = (label or "").lower()
        if any(k in lab for k in include_keywords):
            pos.append(code)
    return pos if pos else [fallback_code]

def parse_true_codes_cli(arg: str) -> Dict[str, List[str]]:
    """
    Parse --true-codes like "inc_MI=1;inc_hf_2018=1,2"
    -> {"inc_MI": ["1"], "inc_hf_2018": ["1","2"]}
    """
    out: Dict[str, List[str]] = {}
    if not arg:
        return out
    for part in arg.split(";"):
        if "=" not in part:
            continue
        var, codes = part.split("=", 1)
        var = var.strip()
        clist = [c.strip() for c in codes.split(",") if c.strip() != ""]
        out[var] = clist
    return out



# ----------------------------
# Date parsing/formatting (robust)
# ----------------------------
EXCEL_EPOCH = pd.Timestamp("1899-12-30")

def _try_excel_serial(s: str) -> Optional[pd.Timestamp]:
    try:
        # Excel serial numbers are integers or floats
        val = float(s)
        if np.isnan(val):
            return None
        # negative or tiny values are unlikely to be valid dates
        if val <= 0:
            return None
        return EXCEL_EPOCH + pd.to_timedelta(int(val), unit="D")
    except Exception:
        return None

def parse_date_strict_one(x: Any) -> pd.Timestamp:
    """
    Parse one value:
      - numeric/serial -> Excel days since 1899-12-30
      - string with '/' -> MM/DD/YYYY
      - string with '-' -> DD-MM-YYYY (fallback to pandas)
      - ISO YYYY-MM-DD supported via pandas
    """
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return pd.NaT

    # numeric or numeric-looking string: try Excel serial
    if isinstance(x, (int, float)) or (isinstance(x, str) and re.fullmatch(r"\d+(\.\d+)?", x.strip())):
        ts = _try_excel_serial(str(x).strip())
        if ts is not None:
            return ts
        # fallthrough if not a valid serial

    s = str(x).strip()
    if not s:
        return pd.NaT

    try:
        if "/" in s:
            return pd.to_datetime(s, format="%m/%d/%Y", errors="coerce")
        if "-" in s:
            dt = pd.to_datetime(s, format="%d-%m-%Y", errors="coerce")
            if pd.isna(dt):
                # handle ISO yyyy-mm-dd or other variants
                dt = pd.to_datetime(s, errors="coerce")
            return dt
        # final fallback (ISO etc.)
        return pd.to_datetime(s, errors="coerce")
    except Exception:
        return pd.NaT

def to_datetime_series(series: Optional[pd.Series]) -> pd.Series:
    if series is None:
        return pd.Series(dtype="datetime64[ns]")
    return series.apply(parse_date_strict_one)

def fmt_dd_mm_yyyy(dt_series: pd.Series) -> pd.Series:
    return dt_series.dt.strftime("%d-%m-%Y").where(dt_series.notna(), "")

# ----------------------------
# Other helpers
# ----------------------------
def choose_first_nonnull_numeric(df: pd.DataFrame, cols: List[str]) -> pd.Series:
    out = pd.Series([np.nan] * len(df), index=df.index, dtype="float64")
    for c in cols:
        if c in df.columns:
            v = pd.to_numeric(df[c], errors="coerce")
            out = out.where(~out.isna(), v)
    return out

# ----------------------------
# Core transform
# ----------------------------
def transform(df: pd.DataFrame,
              sheet2_map: Dict[str, Dict[str, str]],
              true_codes_override: Dict[str, List[str]],
              force_inc_if_date_present: bool,
              quiet: bool = False) -> pd.DataFrame:

    out = pd.DataFrame(index=df.index)

    # 1) Copy original RS columns unchanged
    keep_cols = [
        COL["id"], COL["baseline_date"], COL["birth_date"], COL["sex"], COL["age"],
        COL["sbp"], COL["dbp"], COL["hdl"], *COL["ldl_priority"], COL["tchol"], COL["creat_umol"], COL["egfr"], COL["smoking"],
        COL["prev_htn"], COL["prev_dm"], COL["prev_mi"], COL["prev_stroke_tia"], COL["prev_hf"],
        COL["inc_mi_flag"], COL["inc_mi_date_or_censor"], COL["stroke_date"], COL["inc_hf_flag"], COL["inc_hf_date_or_censor"],
        COL["death_date"], COL["last_contact_date"], COL["overall_censor_date"],
    ]
    keep_cols = [c for c in keep_cols if c in df.columns]
    for c in keep_cols: out[c] = df[c]

    # 2) Mapped categories (sex, smoking) using Sheet2; fallback map if needed
    sex_map = resolve_var_map_for_column(sheet2_map, COL["sex"]) or {"0": "female", "1": "male", "2": "other"}
    smoking_map = resolve_var_map_for_column(sheet2_map, COL["smoking"]) or {"0": "never", "1": "past", "2": "current"}
    out["sex_mapped"] = df[COL["sex"]].map(lambda v: sex_map.get(_norm_code(v), None)) if COL["sex"] in df.columns else None
    out["smoking_status"] = df[COL["smoking"]].map(lambda v: smoking_map.get(_norm_code(v), None)) if COL["smoking"] in df.columns else None

    # 3) Parse datetime copies for derivations
    baseline_dt = to_datetime_series(df.get(COL["baseline_date"])) if COL["baseline_date"] in df.columns else pd.Series(pd.NaT, index=df.index)
    birth_dt    = to_datetime_series(df.get(COL["birth_date"])) if COL["birth_date"] in df.columns else pd.Series(pd.NaT, index=df.index)
    mi_dt       = to_datetime_series(df.get(COL["inc_mi_date_or_censor"])) if COL["inc_mi_date_or_censor"] in df.columns else pd.Series(pd.NaT, index=df.index)
    stroke_dt   = to_datetime_series(df.get(COL["stroke_date"])) if COL["stroke_date"] in df.columns else pd.Series(pd.NaT, index=df.index)
    hf_dt       = to_datetime_series(df.get(COL["inc_hf_date_or_censor"])) if COL["inc_hf_date_or_censor"] in df.columns else pd.Series(pd.NaT, index=df.index)

    # 4) Age at baseline
    if COL["age"] in df.columns:
        out["age_at_baseline_years"] = pd.to_numeric(df[COL["age"]], errors="coerce")
        out["age_at_baseline_years_derived"] = ((baseline_dt - birth_dt).dt.days / 365.25).round(2)
    else:
        out["age_at_baseline_years"] = ((baseline_dt - birth_dt).dt.days / 365.25).round(2)
        out["age_at_baseline_years_derived"] = out["age_at_baseline_years"]

    # 5) LDL chosen
    out["LDL_mmol_chosen"] = choose_first_nonnull_numeric(df, [c for c in COL["ldl_priority"] if c in df.columns])

    # 6) Prevalent flags
    def bool_from_map_or_default(series: pd.Series, varname: str, pos_keywords: List[str]) -> pd.Series:
        m = resolve_var_map_for_column(sheet2_map, varname)
        true_codes = discover_true_codes(m, pos_keywords, fallback_code="1")
        return series.map(lambda v: _norm_code(v) in true_codes)

    if COL["prev_htn"] in df.columns: out[f"{COL['prev_htn']}_bool"] = bool_from_map_or_default(df[COL["prev_htn"]], COL["prev_htn"], ["history","prevalent","yes","present"])
    if COL["prev_mi"]  in df.columns: out[f"{COL['prev_mi']}_bool"]  = bool_from_map_or_default(df[COL["prev_mi"]],  COL["prev_mi"],  ["history","prevalent","yes","present"])
    if COL.get("prev_dm") in df.columns: out["prev_DM_type"] = df[COL["prev_dm"]].map(
        lambda v: {"1": "non-insuline dependent", "2": "insulin dependent"}.get(_norm_code(v), None)
    )
    # Boolean “has diabetes at baseline”
    out["prev_DM_bool"] = df[COL["prev_dm"]].map(lambda v: _norm_code(v) in {"2"})
    if COL["prev_stroke_tia"] in df.columns: out[f"{COL['prev_stroke_tia']}_bool"] = bool_from_map_or_default(df[COL["prev_stroke_tia"]], COL["prev_stroke_tia"], ["history","prevalent","yes","present"])
    if COL["prev_hf"]  in df.columns: out[f"{COL['prev_hf']}_bool"]  = bool_from_map_or_default(df[COL['prev_hf']],  COL["prev_hf"],  ["history","prevalent","yes","present"])

    # 7) Incident flags (Sheet2-driven, CLI overrides, optional force if date present)
    def incident_bool(series: pd.Series, colname: str, date_series: pd.Series) -> pd.Series:
        # CLI override first
        if colname in true_codes_override and len(true_codes_override[colname]):
            true_codes = set(true_codes_override[colname])
            inc = series.map(lambda v: _norm_code(v) in true_codes)
        else:
            # discover from Sheet2
            m = resolve_var_map_for_column(sheet2_map, colname)
            inc_codes = set(discover_true_codes(m, ["incident","yes","ja"], fallback_code="1"))
            inc = series.map(lambda v: _norm_code(v) in inc_codes)
        if force_inc_if_date_present:
            # If date present and current inc is False/NaN, set to True
            inc = inc | date_series.notna()
        return inc.fillna(False)

    inc_mi_bool = incident_bool(df.get(COL["inc_mi_flag"], pd.Series([None]*len(df))), COL["inc_mi_flag"], mi_dt) if COL["inc_mi_flag"] in df.columns else pd.Series([False]*len(df), index=df.index)
    inc_hf_bool = incident_bool(df.get(COL["inc_hf_flag"], pd.Series([None]*len(df))), COL["inc_hf_flag"], hf_dt) if COL["inc_hf_flag"] in df.columns else pd.Series([False]*len(df), index=df.index)

    out["incident_mi_bool"] = inc_mi_bool
    out["incident_hf_bool"] = inc_hf_bool

    # 8) Incident stroke: date present & > baseline & not prevalent stroke/TIA
    prev_stroke_bool = out.get(f"{COL['prev_stroke_tia']}_bool", pd.Series([False]*len(df), index=df.index))
    stroke_after_baseline = (stroke_dt > baseline_dt) | baseline_dt.isna()
    incident_stroke_bool = stroke_dt.notna() & stroke_after_baseline & ~prev_stroke_bool
    out["incident_stroke_bool"] = incident_stroke_bool

    # 9) Derived event dates (datetime series first)
    incident_mi_date_dt     = pd.Series(np.where(inc_mi_bool, mi_dt,     pd.NaT), index=df.index)
    incident_hf_date_dt     = pd.Series(np.where(inc_hf_bool, hf_dt,     pd.NaT), index=df.index)
    incident_stroke_date_dt = pd.Series(np.where(incident_stroke_bool, stroke_dt, pd.NaT), index=df.index)

    # 10) Composite (earliest non-NaT)
    comp_dt = pd.concat([incident_mi_date_dt, incident_stroke_date_dt, incident_hf_date_dt], axis=1).min(axis=1, skipna=True)
    out["incident_cvd_composite_bool"] = inc_mi_bool | incident_stroke_bool | inc_hf_bool

    # 11) Add derived date columns (formatted to DD-MM-YYYY)
    def to_fmt(s: pd.Series) -> pd.Series:
        return fmt_dd_mm_yyyy(pd.to_datetime(s, errors="coerce"))

    date_cols_to_format = {
        COL["baseline_date"]: baseline_dt,
        COL["birth_date"]:    birth_dt,
        COL["inc_mi_date_or_censor"]: mi_dt,
        COL["stroke_date"]:   stroke_dt,
        COL["inc_hf_date_or_censor"]: hf_dt,
        COL["death_date"]:    to_datetime_series(df.get(COL["death_date"])) if COL["death_date"] in df.columns else pd.Series(pd.NaT, index=df.index),
        COL["last_contact_date"]: to_datetime_series(df.get(COL["last_contact_date"])) if COL["last_contact_date"] in df.columns else pd.Series(pd.NaT, index=df.index),
        COL["overall_censor_date"]: to_datetime_series(df.get(COL["overall_censor_date"])) if COL["overall_censor_date"] in df.columns else pd.Series(pd.NaT, index=df.index),
        "incident_mi_date_derived": incident_mi_date_dt,
        "incident_stroke_date_derived": incident_stroke_date_dt,
        "incident_hf_date_derived": incident_hf_date_dt,
        "incident_cvd_date_derived": comp_dt,
    }

    for name, dtser in date_cols_to_format.items():
        if name in out.columns or name.startswith("incident_"):
            out[name] = to_fmt(dtser)

    # 12) Diagnostics
    if not quiet:
        def uniq(series, n=10):
            return list(pd.Series(series).dropna().astype(str).str.strip().unique()[:n])
        print("\n[Diagnostics]")
        print("  Unique inc_MI codes (first 10):", uniq(df.get(COL["inc_mi_flag"], pd.Series(dtype=str))))
        print("  Unique inc_hf_2018 codes (first 10):", uniq(df.get(COL["inc_hf_flag"], pd.Series(dtype=str))))
        print("  Sample enddat_MI values:", uniq(df.get(COL["inc_mi_date_or_censor"], pd.Series(dtype=str))))
        print("  Sample enddat_hf values:", uniq(df.get(COL["inc_hf_date_or_censor"], pd.Series(dtype=str))))
        print("  Sample stroke_date values:", uniq(df.get(COL['stroke_date'], pd.Series(dtype=str))))
        print(f"  incident_mi_bool TRUE: {int(inc_mi_bool.sum())}")
        print(f"  incident_hf_bool TRUE: {int(inc_hf_bool.sum())}")
        print(f"  incident_stroke_bool TRUE: {int(incident_stroke_bool.sum())}")
        print(f"  incident_mi_date_derived non-empty: {int((out['incident_mi_date_derived']!='').sum())}")
        print(f"  incident_hf_date_derived non-empty: {int((out['incident_hf_date_derived']!='').sum())}")
        print(f"  incident_stroke_date_derived non-empty: {int((out['incident_stroke_date_derived']!='').sum())}")
        print(f"  incident_cvd_date_derived non-empty: {int((out['incident_cvd_date_derived']!='').sum())}\n")

    return out

# ----------------------------
# CLI
# ----------------------------
def main():
    ap = argparse.ArgumentParser(description="RS full CSV → compact PoC CSV (robust dates, Sheet2-aware, diagnostics).")
    ap.add_argument("--in", dest="inp", required=True, help="Path to full RS CSV.")
    ap.add_argument("--out", dest="out", required=True, help="Path to write compact CSV.")
    ap.add_argument("--codebook", dest="codebook", default="", help="Path to rs_cvd_variables.xlsx (Sheet2).")
    ap.add_argument("--sep", dest="sep", default=",", help="CSV separator (default ',').")
    ap.add_argument("--encoding", dest="encoding", default="utf-8", help="File encoding (default utf-8).")
    ap.add_argument("--true-codes", dest="true_codes", default="", help='Override true codes, e.g. "inc_MI=1;inc_hf_2018=1"')
    ap.add_argument("--force-incident-if-date-present", dest="force_inc", action="store_true", help="If set, mark MI/HF incident when their date field is non-empty.")
    ap.add_argument("--quiet", dest="quiet", action="store_true", help="Suppress diagnostics.")
    args = ap.parse_args()

    df = pd.read_csv(args.inp, sep=args.sep, encoding=args.encoding, dtype=str)
    sheet2_map = load_sheet2_value_map(args.codebook) if args.codebook else {}
    true_codes_override = parse_true_codes_cli(args.true_codes)

    compact = transform(
        df,
        sheet2_map=sheet2_map,
        true_codes_override=true_codes_override,
        force_inc_if_date_present=args.force_inc,
        quiet=args.quiet,
    )

    compact = compact[compact["date_int_cen"].notna() & (compact["date_int_cen"] != "")]


    compact.to_csv(args.out, index=False, encoding=args.encoding)
    if not args.quiet:
        print(f"Wrote: {args.out} (n={len(compact)})")

if __name__ == "__main__":
    main()
