#!/usr/bin/env python3
import argparse, pandas as pd, sys, os

def sniff_sep(path):
    # Simple sniff: count ; and , in the header line
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        header = f.readline()
    return ';' if header.count(';') > header.count(',') else ','

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='inp', required=True, help='Path to original CSV')
    ap.add_argument('--out', dest='out', required=True, help='Path to normalized CSV')
    ap.add_argument('--id-col', required=True, help='Current ID column name in the original CSV (e.g., ergoid or project_pseudo_id)')
    args = ap.parse_args()

    sep = sniff_sep(args.inp)
    df = pd.read_csv(args.inp, sep=sep, dtype=str, encoding='utf-8', engine='python')

    # Strip spaces from headers, normalize case for matching
    cols = {c: c.strip() for c in df.columns}
    df.rename(columns=cols, inplace=True)

    if args.id_col not in df.columns:
        print(f"[error] ID column '{args.id_col}' not found. Available: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)

    # Rename to the canonical header expected by the pipeline
    if args.id_col != 'PROJECT_PSEUDO_ID':
        df.rename(columns={args.id_col: 'PROJECT_PSEUDO_ID'}, inplace=True)

    # Ensure ID is string without leading/trailing spaces
    df['PROJECT_PSEUDO_ID'] = df['PROJECT_PSEUDO_ID'].astype(str).str.strip()

    # Write as comma-delimited, UTF-8
    os.makedirs(os.path.dirname(args.out) or '.', exist_ok=True)
    df.to_csv(args.out, index=False, encoding='utf-8')

    print(f"[ok] Wrote normalized CSV: {args.out}")
    print("[info] Header:", list(df.columns))

if __name__ == '__main__':
    main()
