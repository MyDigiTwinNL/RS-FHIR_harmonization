#!/usr/bin/env python3
"""
Prepare Rotterdam Study outcomes for CDF generation.

Reads the full RS CSV and outputs a compact CSV with just:
- ergoid, date_int_cen, prevalent flags (prev_MI, prev_CVATIA, prev_HF)
- raw incident fields (inc_MI, enddat_MI, stroke_date, inc_hf_2018, enddat_hf)
- derived incident_* flags and *_date (MI, stroke, HF)
- derived composite (incident_cvd_composite, incident_cvd_date)
"""

import argparse
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd

# ---------- Config: edit if your extract uses different names ----------
COLUMN_NAMES = {
    "id": "ergoid",
    "baseline_date": "date_int_cen",

    "prev_mi": "prev_MI",
    "prev_stroke_tia": "prev_CVATIA",
    "prev_hf": "prev_HF",

    "inc_mi_flag": "inc_MI",
    "inc_mi_date_or_censor": "enddat_MI",

    "stroke_date": "stroke_date",

    "inc_hf_flag": "inc_hf_2018",
    "inc_hf_date_or_censor": "enddat_hf",

    # optional
    "death_date": "fp_mortdat",
    "last_contact_date": "fp_date_lastcontact",
    "overall_censor_date": "fp_censordate",
}

TRUE_TOKENS = {"1","true","t","yes","y","ja","waar","si"}
FALSE_TOKENS = {"0","false","f","no","n","nee","onwaar"}

def to_bool(x: Any) -> Optional[bool]:
    if x is None or (isinstance(x, float) and np.isnan(x)):
        return None
    s = str(x).strip().lower()
    if s in TRUE_TOKENS:
        return True
    if s in FALSE_TOKENS:
        return False
    try:
        v = float(s)
        if v == 1:
            return True
        if v == 0:
            return False
    except Exception:
        pass
    return None

def parse_date(series: pd.Series) -> pd.Series:
    # removed deprecated infer_datetime_format
    return pd.to_datetime(series, errors="coerce", utc=False).dt.date

def min_date_ignore_null(dates: List[Optional[pd.Timestamp]]) -> Optional[pd.Timestamp]:
    vals = [pd.to_datetime(d) for d in dates if pd.notna(d)]
    if not vals:
        return pd.NaT
    return min(vals)

def transform_df(df: pd.DataFrame, col: Dict[str, str]) -> pd.DataFrame:
    required = [
        col["id"], col["baseline_date"],
        col["prev_mi"], col["prev_stroke_tia"], col["prev_hf"],
        col["inc_mi_flag"], col["inc_mi_date_or_censor"],
        col["stroke_date"],
        col["inc_hf_flag"], col["inc_hf_date_or_censor"],
    ]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns in input CSV: {missing}")

    # Parse dates
    baseline_dt = parse_date(df[col["baseline_date"]])
    mi_dt      = parse_date(df[col["inc_mi_date_or_censor"]])
    stroke_dt  = parse_date(df[col["stroke_date"]])
    hf_dt      = parse_date(df[col["inc_hf_date_or_censor"]])

    # Flags
    prev_mi  = df[col["prev_mi"]].apply(to_bool)
    prev_cv  = df[col["prev_stroke_tia"]].apply(to_bool)
    prev_hf  = df[col["prev_hf"]].apply(to_bool)

    inc_mi_flag = df[col["inc_mi_flag"]].apply(to_bool)
    inc_hf_flag = df[col["inc_hf_flag"]].apply(to_bool)

    # Incident MI: date = enddat_MI when inc_MI is True
    incident_mi = inc_mi_flag.fillna(False)
    incident_mi_date = np.where(incident_mi, mi_dt, pd.NaT)

    # Incident Stroke: derive from stroke_date (> baseline, not prevalent)
    stroke_after_baseline = (pd.to_datetime(stroke_dt) > pd.to_datetime(baseline_dt)) | baseline_dt.isna()
    not_prevalent_stroke  = ~(prev_cv.fillna(False))
    incident_stroke = stroke_dt.notna() & stroke_after_baseline & not_prevalent_stroke
    incident_stroke_date = np.where(incident_stroke, stroke_dt, pd.NaT)

    # Incident HF: date = enddat_hf when inc_hf_2018 is True
    incident_hf = inc_hf_flag.fillna(False)
    incident_hf_date = np.where(incident_hf, hf_dt, pd.NaT)

    # Composite CVD: earliest of available incident dates
    comp_dates = []
    for mi_d, st_d, hf_d in zip(incident_mi_date, incident_stroke_date, incident_hf_date):
        comp_dates.append(min_date_ignore_null([mi_d, st_d, hf_d]))
    comp_dates = pd.Series(pd.to_datetime(comp_dates)).dt.date

    incident_cvd = incident_mi | incident_stroke | incident_hf
    incident_cvd_date = np.where(incident_cvd, comp_dates, pd.NaT)

    # Optional
    death_date = parse_date(df[col["death_date"]]) if col["death_date"] in df.columns else pd.NaT
    last_contact = parse_date(df[col["last_contact_date"]]) if col["last_contact_date"] in df.columns else pd.NaT
    overall_censor = parse_date(df[col["overall_censor_date"]]) if col["overall_censor_date"] in df.columns else pd.NaT

    # Output
    out = pd.DataFrame({
        "ergoid": df[col["id"]],
        "date_int_cen": baseline_dt,
        "prev_MI": prev_mi,
        "prev_CVATIA": prev_cv,
        "prev_HF": prev_hf,

        "inc_MI": inc_mi_flag,
        "enddat_MI": mi_dt,

        "stroke_date": stroke_dt,

        "inc_hf_2018": inc_hf_flag,
        "enddat_hf": hf_dt,
    })

    # Use Series wrapping to avoid DatetimeIndex .dt errors
    out["incident_mi"] = incident_mi.astype(bool)
    out["incident_mi_date"] = pd.to_datetime(pd.Series(incident_mi_date), errors="coerce").dt.date

    out["incident_stroke"] = incident_stroke.astype(bool)
    out["incident_stroke_date"] = pd.to_datetime(pd.Series(incident_stroke_date), errors="coerce").dt.date

    out["incident_hf"] = incident_hf.astype(bool)
    out["incident_hf_date"] = pd.to_datetime(pd.Series(incident_hf_date), errors="coerce").dt.date

    out["incident_cvd_composite"] = incident_cvd.astype(bool)
    out["incident_cvd_date"] = pd.to_datetime(pd.Series(incident_cvd_date), errors="coerce").dt.date

    if isinstance(death_date, pd.Series):
        out["fp_mortdat"] = death_date
    if isinstance(last_contact, pd.Series):
        out["fp_date_lastcontact"] = last_contact
    if isinstance(overall_censor, pd.Series):
        out["fp_censordate"] = overall_censor

    return out

def main():
    ap = argparse.ArgumentParser(description="Prepare Rotterdam Study outcomes for CDF harmonization.")
    ap.add_argument("--in", dest="inp", required=True, help="Path to full RS CSV.")
    ap.add_argument("--out", dest="out", required=True, help="Path to write compact outcomes CSV.")
    ap.add_argument("--sep", dest="sep", default=",", help="CSV separator (default ',').")
    ap.add_argument("--encoding", dest="encoding", default="utf-8", help="File encoding (default utf-8).")
    args = ap.parse_args()

    df = pd.read_csv(args.inp, sep=args.sep, encoding=args.encoding, dtype=str)
    out = transform_df(df, COLUMN_NAMES)
    out.to_csv(args.out, index=False)
    print(f"Wrote: {args.out}  (n={len(out)})")

if __name__ == "__main__":
    main()
