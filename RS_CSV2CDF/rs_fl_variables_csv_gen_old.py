#!/usr/bin/env python3
"""
RS full CSV -> compact PoC CSV (risk factors + outcomes) with precise value handling.

Key principles to avoid *any* mis-conversion:
- We NEVER overwrite original RS columns. We carry them forward unchanged.
- We ONLY add derived columns with clear names (e.g., _bool, _iso, _derived).
- All boolean derivations for incidence / prevalence use exact code equality checks,
  *informed by Sheet2* (Value -> Label) when available.
- Dates used for derivations are parsed copies; original date strings are preserved.

Inputs
------
1) Full RS CSV: wide, per-participant.
2) (Optional) Codebook Excel with value codings:
      rs_cvd_variables.xlsx  (Sheet2 = "Variable Values" table)

Output
------
Compact CSV with:
- IDs/demographics/baseline timing: ergoid, date_int_cen, gebdatum, sexe, age
- Risk factors: sbp, dbp, lipids, creat_umol, GFR, smoking, prev_HT
- Prevalent CVD flags: prev_MI, prev_CVATIA, prev_HF
- Outcome fields: inc_MI, enddat_MI, stroke_date, inc_hf_2018, enddat_hf
- Optional follow-up: fp_mortdat, fp_date_lastcontact, fp_censordate
- Derived columns:
    * sex_mapped        (from Sheet2 if available)
    * smoking_status    (from Sheet2 if available)
    * age_at_baseline_years_derived   (if "age" absent; otherwise kept for QA)
    * prev_*_bool,  inc_*_bool        (strict equals to incident codes)
    * *_date_iso       (ISO date copies of originals)
    * incident_*_date_derived (event date used for PoC)
    * incident_cvd_composite_bool, incident_cvd_date_derived

Usage
-----
python rs_full_to_compact_precise.py \
  --in /path/full.csv \
  --out /path/compact.csv \
  --codebook /path/rs_cvd_variables.xlsx \
  [--sep ,] [--encoding utf-8]
"""

import argparse
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

# ----------------------------
# 1) RS column names (as in your files). Edit here if your headers differ.
# ----------------------------
COL = {
    # identifiers / baseline timing / demographics
    "id": "ergoid",
    "baseline_date": "date_int_cen",
    "birth_date": "gebdatum",
    "sex": "sexe",
    "age": "age",  # RS also provides age at baseline; if missing, we derive.

    # risk factors
    "sbp": "sbp",
    "dbp": "dbp",
    "hdl": "HDL_mmol",
    "ldl_priority": ["LDL_mmol_centri", "LDL_Friedewald_mmol", "LDL_Martin_mmol"],  # pick first non-null
    "tchol": "TC_mmol",
    "creat_umol": "creat_umol",
    "egfr": "GFR",
    "smoking": "smoking",   # numeric-coded; Sheet2 has 0:never,1:past,2:current

    # baseline history
    "prev_htn": "prev_HT",
    "prev_mi": "prev_MI",
    "prev_stroke_tia": "prev_CVATIA",
    "prev_hf": "prev_HF",

    # outcomes (component endpoints)
    "inc_mi_flag": "inc_MI",
    "inc_mi_date_or_censor": "enddat_MI",  # use as event date when inc_MI means 'incident'
    "stroke_date": "stroke_date",          # stroke event date; derive flag
    "inc_hf_flag": "inc_hf_2018",
    "inc_hf_date_or_censor": "enddat_hf",  # use as event date when inc_hf_2018 means 'incident'

    # optional follow-up/censoring
    "death_date": "fp_mortdat",
    "last_contact_date": "fp_date_lastcontact",
    "overall_censor_date": "fp_censordate",
}

# ----------------------------
# 2) Parse Sheet2 (value codings)
# ----------------------------
def load_value_map_from_sheet2(xlsx_path: Optional[str]) -> Dict[str, Dict[Any, str]]:
    """
    Reads Sheet2 which is structured as:
      Row 0: "Variable Values"
      Row 1: "Value"  |  "Label"
      Then blocks:
        varname in col0, code in col1, label in col2
        followed by rows with NaN in col0 (same var), code in col1, label in col2
      next varname repeats in col0, etc.

    Returns: { varname: { code: label, ... }, ... }
    """
    if not xlsx_path:
        return {}

    df = pd.read_excel(xlsx_path, sheet_name="Sheet2", header=None)
    # Find where var blocks begin
    value_map: Dict[str, Dict[Any, str]] = {}
    current_var: Optional[str] = None

    for _, row in df.iterrows():
        var = row[0]
        code = row[1]
        label = row[2]

        # Skip header rows
        if isinstance(var, str) and var.strip().lower() in {"variable values", "value"}:
            continue

        if isinstance(var, str) and var.strip() != "":
            # New variable block begins
            current_var = var.strip()
            value_map.setdefault(current_var, {})
            if pd.notna(code):
                value_map[current_var][code] = str(label) if pd.notna(label) else ""
        else:
            # Continuation of the current variable
            if current_var is not None and pd.notna(code):
                value_map[current_var][code] = str(label) if pd.notna(label) else ""

    return value_map

# ----------------------------
# 3) Helpers (safe parsing that doesn't mutate original columns)
# ----------------------------
def to_bool_code(x: Any, true_codes: List[Any]) -> Optional[bool]:
    """Strict bool based on explicit true codes."""
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return None
    try:
        # compare as string or numeric equality
        if str(x).strip() in {str(c) for c in true_codes}:
            return True
        try:
            return float(x) in [float(c) for c in true_codes]
        except Exception:
            return False
    except Exception:
        return None

def parse_date(series: pd.Series) -> pd.Series:
    """Parse copy to datetime; original strings are preserved elsewhere."""
    return pd.to_datetime(series, errors="coerce")

def choose_first_nonnull(df: pd.DataFrame, cols: List[str]) -> pd.Series:
    out = pd.Series([np.nan] * len(df), index=df.index, dtype="float64")
    for c in cols:
        if c in df.columns:
            v = pd.to_numeric(df[c], errors="coerce")
            out = out.where(~out.isna(), v)
    return out

def min_date_ignore_null(dates: List[pd.Timestamp]) -> pd.Timestamp:
    vals = [pd.to_datetime(d) for d in dates if pd.notna(d)]
    if not vals:
        return pd.NaT
    return min(vals)

# ----------------------------
# 4) Core transform
# ----------------------------
def transform(df: pd.DataFrame, value_map: Dict[str, Dict[Any, str]]) -> pd.DataFrame:
    # --- carry original columns (unchanged) ---
    keep_cols = [
        # IDs/timing/demographics
        COL["id"], COL["baseline_date"], COL["birth_date"], COL["sex"], COL["age"],
        # risk factors (raw)
        COL["sbp"], COL["dbp"], COL["hdl"], *COL["ldl_priority"], COL["tchol"], COL["creat_umol"], COL["egfr"], COL["smoking"],
        # baseline history
        COL["prev_htn"], COL["prev_mi"], COL["prev_stroke_tia"], COL["prev_hf"],
        # outcomes
        COL["inc_mi_flag"], COL["inc_mi_date_or_censor"], COL["stroke_date"],
        COL["inc_hf_flag"], COL["inc_hf_date_or_censor"],
        # optional
        COL["death_date"], COL["last_contact_date"], COL["overall_censor_date"],
    ]
    keep_cols = [c for c in keep_cols if c in df.columns]  # tolerate missing

    out = pd.DataFrame(index=df.index)
    for c in keep_cols:
        out[c] = df[c]  # original values, unchanged

    # --- mapped categories from Sheet2 (do not overwrite originals) ---
    # sex
    sex_map = value_map.get(COL["sex"], {})  # e.g., {0.0:'male', 1.0:'female'}
    if COL["sex"] in df.columns and sex_map:
        out["sex_mapped"] = df[COL["sex"]].map(lambda x: sex_map.get(_normalize_code_key(x), None))
    else:
        out["sex_mapped"] = None

    # smoking
    smoking_map = value_map.get(COL["smoking"], {})  # e.g., {0.0:'never', 1.0:'past', 2.0:'current'}
    if COL["smoking"] in df.columns and smoking_map:
        out["smoking_status"] = df[COL["smoking"]].map(lambda x: smoking_map.get(_normalize_code_key(x), None))
    else:
        out["smoking_status"] = None

    # --- parse date copies (ISO) for derivations; keep originals intact ---
    baseline_dt = parse_date(df.get(COL["baseline_date"])) if COL["baseline_date"] in df.columns else pd.Series(pd.NaT, index=df.index)
    birth_dt    = parse_date(df.get(COL["birth_date"])) if COL["birth_date"] in df.columns else pd.Series(pd.NaT, index=df.index)
    out[COL["baseline_date"] + "_iso"] = baseline_dt.dt.date if COL["baseline_date"] in df.columns else None
    out[COL["birth_date"] + "_iso"]    = birth_dt.dt.date    if COL["birth_date"] in df.columns else None

    # age (prefer RS-provided; otherwise derive)
    if COL["age"] in df.columns:
        out["age_at_baseline_years"] = pd.to_numeric(df[COL["age"]], errors="coerce")
        out["age_at_baseline_years_derived"] = (baseline_dt - birth_dt).dt.days.div(365.25).round(2)
    else:
        out["age_at_baseline_years"] = (baseline_dt - birth_dt).dt.days.div(365.25).round(2)
        out["age_at_baseline_years_derived"] = out["age_at_baseline_years"]

    # risk factor helpers (keep originals; compute QC copies if useful)
    ldl_choice = choose_first_nonnull(df, [c for c in COL["ldl_priority"] if c in df.columns])
    if len(ldl_choice) == len(df):
        out["LDL_mmol_chosen"] = ldl_choice

    # --- prevalence flags (strict codes) ---
    # Sheet2 shows: e.g., prev_MI: 0=no MI, 1=history of MI, 7/8/9 special
    # We set booleans ONLY for code == 1 (history present). This is a *derived* column; original is untouched.
    def eq_one_bool(colname: str) -> Optional[pd.Series]:
        if colname not in df.columns:
            return None
        return df[colname].apply(lambda v: str(v).strip() == "1")

    for prev_col in [COL["prev_htn"], COL["prev_mi"], COL["prev_stroke_tia"], COL["prev_hf"]]:
        if prev_col in df.columns:
            out[f"{prev_col}_bool"] = eq_one_bool(prev_col)

    # --- incident outcomes (strict codes) ---
    # inc_MI: Sheet2 shows 0=no MI, 1=incident MI, 7/8/9 special (not incident)
    if COL["inc_mi_flag"] in df.columns:
        inc_mi_bool = df[COL["inc_mi_flag"]].apply(lambda v: str(v).strip() == "1")
        out["incident_mi_bool"] = inc_mi_bool
    else:
        inc_mi_bool = pd.Series([False]*len(df), index=df.index)
        out["incident_mi_bool"] = inc_mi_bool

    # inc_hf_2018: 0=no HF, 1=incident HF, 7/8/9 special (not incident)
    if COL["inc_hf_flag"] in df.columns:
        inc_hf_bool = df[COL["inc_hf_flag"]].apply(lambda v: str(v).strip() == "1")
        out["incident_hf_bool"] = inc_hf_bool
    else:
        inc_hf_bool = pd.Series([False]*len(df), index=df.index)
        out["incident_hf_bool"] = inc_hf_bool

    # Dates for MI/HF (copy iso); use as event date ONLY when incident flag is true
    mi_dt  = parse_date(df.get(COL["inc_mi_date_or_censor"])) if COL["inc_mi_date_or_censor"] in df.columns else pd.Series(pd.NaT, index=df.index)
    hf_dt  = parse_date(df.get(COL["inc_hf_date_or_censor"])) if COL["inc_hf_date_or_censor"] in df.columns else pd.Series(pd.NaT, index=df.index)
    out[COL["inc_mi_date_or_censor"] + "_iso"] = mi_dt.dt.date if COL["inc_mi_date_or_censor"] in df.columns else None
    out[COL["inc_hf_date_or_censor"] + "_iso"] = hf_dt.dt.date if COL["inc_hf_date_or_censor"] in df.columns else None

    incident_mi_date = pd.Series(np.where(inc_mi_bool, mi_dt, pd.NaT), index=df.index)
    incident_hf_date = pd.Series(np.where(inc_hf_bool, hf_dt, pd.NaT), index=df.index)
    out["incident_mi_date_derived"] = pd.to_datetime(incident_mi_date, errors="coerce").dt.date
    out["incident_hf_date_derived"] = pd.to_datetime(incident_hf_date, errors="coerce").dt.date

    # Stroke: derive flag from stroke_date presence (> baseline) AND not prevalent stroke/TIA
    stroke_dt = parse_date(df.get(COL["stroke_date"])) if COL["stroke_date"] in df.columns else pd.Series(pd.NaT, index=df.index)
    out[COL["stroke_date"] + "_iso"] = stroke_dt.dt.date if COL["stroke_date"] in df.columns else None

    prev_stroke_bool = out[f"{COL['prev_stroke_tia']}_bool"] if f"{COL['prev_stroke_tia']}_bool" in out.columns else pd.Series([False]*len(df), index=df.index)
    stroke_after_baseline = (stroke_dt > baseline_dt) | baseline_dt.isna()
    incident_stroke_bool = stroke_dt.notna() & stroke_after_baseline & ~prev_stroke_bool
    out["incident_stroke_bool"] = incident_stroke_bool
    out["incident_stroke_date_derived"] = pd.to_datetime(pd.Series(np.where(incident_stroke_bool, stroke_dt, pd.NaT)), errors="coerce").dt.date

    # Composite CVD (earliest of MI/HF/stroke incident dates)
    earliest = []
    for mi_d, st_d, hf_d in zip(incident_mi_date, stroke_dt, incident_hf_date):
        # for stroke, include only when incident_stroke_bool True; else NaT
        st_x = st_d if pd.notna(st_d) else pd.NaT
        earliest.append(min_date_ignore_null([mi_d if pd.notna(mi_d) else pd.NaT,
                                              st_x if pd.notna(st_x) else pd.NaT,
                                              hf_d if pd.notna(hf_d) else pd.NaT]))
    earliest = pd.to_datetime(pd.Series(earliest), errors="coerce")
    incident_cvd_bool = inc_mi_bool | incident_stroke_bool | inc_hf_bool
    out["incident_cvd_composite_bool"] = incident_cvd_bool
    out["incident_cvd_date_derived"] = earliest.dt.date

    # Optional QA copies
    for opt_col in [COL["death_date"], COL["last_contact_date"], COL["overall_censor_date"]]:
        if opt_col in df.columns:
            out[opt_col + "_iso"] = parse_date(df[opt_col]).dt.date

    return out

def _normalize_code_key(x: Any) -> Any:
    """Normalize keys for value_map lookups (sheet stores codes as floats)."""
    # Try match as-is, then as float, then as int form of float
    if x in (None, np.nan):
        return x
    # Sheet2 often stores codes as floats (e.g., 1.0). We'll try several forms:
    for conv in (lambda y: y, lambda y: float(y), lambda y: int(float(y))):
        try:
            key = conv(x)
            return key
        except Exception:
            continue
    return x

# ----------------------------
# 5) CLI
# ----------------------------
def main():
    ap = argparse.ArgumentParser(description="RS full CSV → compact PoC CSV (risk factors + outcomes) using Sheet2 mappings precisely.")
    ap.add_argument("--in", dest="inp", required=True, help="Path to full RS CSV.")
    ap.add_argument("--out", dest="out", required=True, help="Path to write compact CSV.")
    ap.add_argument("--codebook", dest="codebook", default="", help="Path to rs_cvd_variables.xlsx (to read Sheet2 value codings).")
    ap.add_argument("--sep", dest="sep", default=",", help="CSV separator (default ',').")
    ap.add_argument("--encoding", dest="encoding", default="utf-8", help="File encoding (default utf-8).")
    args = ap.parse_args()

    # Load data
    df = pd.read_csv(args.inp, sep=args.sep, encoding=args.encoding, dtype=str)
    value_map = load_value_map_from_sheet2(args.codebook) if args.codebook else {}

    compact = transform(df, value_map=value_map)
    compact.to_csv(args.out, index=False)
    print(f"Wrote: {args.out} (n={len(compact)})")

if __name__ == "__main__":
    main()
