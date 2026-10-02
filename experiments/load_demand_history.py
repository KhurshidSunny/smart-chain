"""Load daily demand history for Smart-Chain forecast experiments.

Accepted row fields:
  - productId: string product identifier
  - date: calendar day as YYYY-MM-DD
  - quantity: non-negative demand units for that day

Supports JSON (list of objects) or CSV with the same columns.
Optional Mongo-style exports that already contain daily aggregates work too.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import pandas as pd

REQUIRED_COLUMNS = ("productId", "date", "quantity")
DATE_FORMAT = "%Y-%m-%d"


def _normalize_columns(frame: pd.DataFrame) -> pd.DataFrame:
    rename = {}
    for column in frame.columns:
        key = str(column).strip()
        lower = key.lower().replace(" ", "").replace("_", "")
        if lower in {"productid", "product", "sku"}:
            rename[column] = "productId"
        elif lower in {"date", "day", "ds"}:
            rename[column] = "date"
        elif lower in {"quantity", "qty", "demand", "units"}:
            rename[column] = "quantity"
    return frame.rename(columns=rename)


def _validate_frame(frame: pd.DataFrame, source: Path) -> pd.DataFrame:
    missing = [name for name in REQUIRED_COLUMNS if name not in frame.columns]
    if missing:
        raise ValueError(
            f"{source}: missing required columns {missing}. "
            f"Expected {list(REQUIRED_COLUMNS)}."
        )

    cleaned = frame.loc[:, list(REQUIRED_COLUMNS)].copy()
    cleaned["productId"] = cleaned["productId"].astype(str).str.strip()
    cleaned["date"] = pd.to_datetime(cleaned["date"], errors="coerce").dt.strftime(
        DATE_FORMAT
    )
    cleaned["quantity"] = pd.to_numeric(cleaned["quantity"], errors="coerce")

    if cleaned["productId"].eq("").any() or cleaned["productId"].isna().any():
        raise ValueError(f"{source}: productId must be a non-empty string.")
    if cleaned["date"].isna().any():
        raise ValueError(f"{source}: date must be parseable as YYYY-MM-DD.")
    if cleaned["quantity"].isna().any() or (cleaned["quantity"] < 0).any():
        raise ValueError(f"{source}: quantity must be a non-negative number.")

    cleaned["quantity"] = cleaned["quantity"].astype(float)
    return cleaned


def load_demand_rows(path: str | Path) -> pd.DataFrame:
    """Load raw demand rows from JSON or CSV."""
    source = Path(path)
    if not source.is_file():
        raise FileNotFoundError(f"Demand file not found: {source}")

    suffix = source.suffix.lower()
    if suffix == ".json":
        payload: Any = json.loads(source.read_text(encoding="utf-8"))
        if isinstance(payload, dict) and "rows" in payload:
            payload = payload["rows"]
        if not isinstance(payload, list):
            raise ValueError(f"{source}: JSON must be a list of objects.")
        frame = pd.DataFrame(payload)
    elif suffix == ".csv":
        frame = pd.read_csv(source)
    else:
        raise ValueError(f"{source}: unsupported format (use .json or .csv).")

    if frame.empty:
        raise ValueError(f"{source}: file contains no rows.")

    frame = _normalize_columns(frame)
    return _validate_frame(frame, source)


def build_daily_series(
    rows: pd.DataFrame,
    product_id: str | None = None,
) -> pd.DataFrame:
    """Aggregate rows into a sorted daily series per product.

    If the file already has one row per product/day, quantities are summed
    safely (duplicates collapse). Returns columns: productId, date, quantity.
    """
    frame = rows.copy()
    if product_id is not None:
        wanted = str(product_id)
        frame = frame[frame["productId"] == wanted]
        if frame.empty:
            raise ValueError(f"No rows found for productId={wanted!r}.")

    series = (
        frame.groupby(["productId", "date"], as_index=False)["quantity"]
        .sum()
        .sort_values(["productId", "date"], kind="mergesort")
        .reset_index(drop=True)
    )
    return series


def load_daily_demand(
    path: str | Path,
    product_id: str | None = None,
) -> pd.DataFrame:
    """Convenience: load file and return daily demand series."""
    return build_daily_series(load_demand_rows(path), product_id=product_id)


def series_summary(series: pd.DataFrame) -> list[dict[str, Any]]:
    """Short per-product summary for CLI output."""
    summaries: list[dict[str, Any]] = []
    for product_id, group in series.groupby("productId", sort=True):
        summaries.append(
            {
                "productId": product_id,
                "days": int(len(group)),
                "start": str(group["date"].iloc[0]),
                "end": str(group["date"].iloc[-1]),
                "totalQuantity": float(group["quantity"].sum()),
                "meanDaily": float(group["quantity"].mean()),
            }
        )
    return summaries


def main() -> int:
    default_data = Path(__file__).resolve().parent / "data" / "demo_daily_demand.json"
    parser = argparse.ArgumentParser(
        description="Load Smart-Chain daily demand history for forecast experiments."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=default_data,
        help="Path to JSON or CSV demand export (default: data/demo_daily_demand.json)",
    )
    parser.add_argument(
        "--product-id",
        default=None,
        help="Optional productId filter",
    )
    args = parser.parse_args()

    series = load_daily_demand(args.input, product_id=args.product_id)
    print(f"Loaded {len(series)} daily points from {args.input}")
    for item in series_summary(series):
        print(
            f"  productId={item['productId']}  days={item['days']}  "
            f"range={item['start']}..{item['end']}  "
            f"total={item['totalQuantity']:.1f}  meanDaily={item['meanDaily']:.2f}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
