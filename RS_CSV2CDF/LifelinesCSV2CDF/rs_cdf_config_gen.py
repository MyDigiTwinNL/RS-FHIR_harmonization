#!/usr/bin/env python3
"""
Create (1) the 'file with ids' and (2) the config file for
MyDigiTwinNL/LifelinesCSV2CDF, and ensure the data CSV has 'project_pseudo_id'.

Usage:
  python make_inputs_for_cdfgenerator.py \
      --csv data_csv/rs_raw_data.csv \
      --id-col ergoid \
      --ids-out ids.csv \
      --config-out config.json \
      --assessment a1 \
      --csv-normalized-out data_csv/rs_raw_data_with_ppid.csv

Notes
- The IDs CSV will have a single header: PROJECT_PSEUDO_ID
- The config maps every non-ID column to the *normalized* CSV under the given assessment.
- You can optionally include/exclude specific columns.
"""

import argparse
import csv
import json
import os
import sys
from typing import List, Set

import pandas as pd


def infer_columns(df: pd.DataFrame,
                  id_col: str,
                  include: List[str],
                  exclude: List[str]) -> List[str]:
    cols = list(df.columns)
    if id_col not in cols:
        raise SystemExit(f"[error] ID column '{id_col}' not found in CSV header. "
                         f"Available columns: {cols}")
    vars_all = [c for c in cols if c != id_col]

    incl_set: Set[str] = set([c for c in include if c])
    excl_set: Set[str] = set([c for c in exclude if c])

    if incl_set:
        missing = [c for c in incl_set if c not in vars_all]
        if missing:
            raise SystemExit(f"[error] --include has columns not in CSV (or are ID): {missing}")
        vars_sel = [c for c in vars_all if c in incl_set]
    else:
        vars_sel = vars_all

    if excl_set:
        bad = [c for c in excl_set if c not in vars_all]
        if bad:
            raise SystemExit(f"[error] --exclude has columns not in CSV (or are ID): {bad}")
        vars_sel = [c for c in vars_sel if c not in excl_set]

    if not vars_sel:
        raise SystemExit("[error] No variables selected after include/exclude filtering.")
    return vars_sel


def write_ids_csv(df: pd.DataFrame, id_col_for_ids: str, out_path: str) -> None:
    """
    Write the IDs file with header 'PROJECT_PSEUDO_ID'.
    id_col_for_ids should contain participant IDs (string-like).
    """
    ids = df[id_col_for_ids].astype(str).str.strip()
    ids = ids[ids != ""].dropna().drop_duplicates()
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["project_pseudo_id"])
        for v in ids:
            w.writerow([v])


def write_config_json(csv_path_for_config: str,
                      variables: List[str],
                      assessment_label: str,
                      out_path: str) -> None:
    """
    Write the config JSON mapping each variable to the same normalized CSV
    under the requested assessment label (e.g., 'a1').
    """
    config = {var: [{assessment_label: csv_path_for_config}] for var in variables}
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=4, ensure_ascii=False)


def default_normalized_path(csv_path: str) -> str:
    d, b = os.path.split(csv_path)
    root, ext = os.path.splitext(b)
    return os.path.join(d or ".", f"{root}_with_ppid{ext or '.csv'}")


def main():
    ap = argparse.ArgumentParser(description="Generate 'ids.csv' and 'config.json' for LifelinesCSV2CDF, ensuring project_pseudo_id exists in data CSV.")
    ap.add_argument("--csv", required=True, help="Path to your source CSV (e.g., data_csv/rs_raw_data.csv).")
    ap.add_argument("--id-col", required=True, help="Name of the ID column in your CSV (e.g., ergoid).")
    ap.add_argument("--ids-out", default="ids.csv", help="Where to write the IDs CSV (default: ids.csv).")
    ap.add_argument("--config-out", default="config.json", help="Where to write the config JSON (default: config.json).")
    ap.add_argument("--assessment", default="a1", help="Assessment label to use in the config (default: a1).")
    ap.add_argument("--include", nargs="*", default=[], help="Optional: only include these CSV columns (besides the id).")
    ap.add_argument("--exclude", nargs="*", default=[], help="Optional: exclude these CSV columns.")
    ap.add_argument("--sep", default=",", help="CSV separator for reading source CSV (default ,).")
    ap.add_argument("--encoding", default="utf-8", help="CSV encoding (default utf-8).")
    ap.add_argument("--csv-normalized-out", default=None,
                    help="Path to write a normalized copy with 'project_pseudo_id' added. "
                         "Default: <input_basename>_with_ppid.csv next to input.")
    args = ap.parse_args()

    # Read source CSV
    df = pd.read_csv(args.csv, sep=args.sep, encoding=args.encoding, dtype=str)

    # Validate ID column
    if args.id_col not in df.columns:
        raise SystemExit(f"[error] ID column '{args.id_col}' not found in CSV header. "
                         f"Available columns: {list(df.columns)}")

    # Ensure IDs are clean strings
    df[args.id_col] = df[args.id_col].astype(str).str.strip()

    # Ensure project_pseudo_id exists (duplicate of id_col)
    if "project_pseudo_id" not in df.columns:
        df["project_pseudo_id"] = df[args.id_col]
    else:
        # still normalize spaces
        df["project_pseudo_id"] = df["project_pseudo_id"].astype(str).str.strip()

    # # Also create uppercase column used for the IDs file if helpful elsewhere
    # df["PROJECT_PSEUDO_ID"] = df["project_pseudo_id"]

    # Decide where to write normalized CSV (always write it so the config points to a file that surely has project_pseudo_id)
    normalized_csv_path = args.csv_normalized_out or default_normalized_path(args.csv)
    os.makedirs(os.path.dirname(normalized_csv_path) or ".", exist_ok=True)
    df.to_csv(normalized_csv_path, index=False, encoding=args.encoding)

    # Work out variable list for config (from the *original* header, excluding id_col)
    variables = infer_columns(df, args.id_col, args.include, args.exclude)

    # IDs CSV: from project_pseudo_id (guaranteed to exist now), with header PROJECT_PSEUDO_ID
    write_ids_csv(df, "project_pseudo_id", args.ids_out)

    # Config JSON: point to the normalized CSV (with project_pseudo_id present)
    write_config_json(normalized_csv_path, variables, args.assessment, args.config_out)

    print(f"[ok] Wrote normalized CSV: {normalized_csv_path}")
    print(f"[ok] Wrote IDs file:       {args.ids_out}")
    print(f"[ok] Wrote config file:    {args.config_out}")
    print("\nNext step (from the repo):")
    print(f"  python -m lifelinescsv_to_icdf.cdfgenerator {args.ids_out} {args.config_out} ./out_cdf")
    print("…where './out_cdf' is any output folder you choose.")
    print("\nTip: The config now points to the normalized CSV that contains 'project_pseudo_id',")
    print("     so the generator won't fail with 'Usecols do not match columns'.")
    

if __name__ == "__main__":
    main()
