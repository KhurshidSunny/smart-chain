"""Export forecast holdout evaluation rows to CSV for offline review.

Writes one row per productId × method with mae and mape from the same protocol
as compare_forecast_methods.py (MA, exponential smoothing, sklearn Ridge lag).
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Any

from classical_forecast import DEFAULT_HORIZON_DAYS, FORECAST_HORIZONS
from compare_forecast_methods import compare_product
from load_demand_history import load_daily_demand

DEFAULT_INPUT = Path(__file__).resolve().parent / "data" / "demo_daily_demand.json"
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[1] / "docs" / "samples" / "evaluation_rows.csv"
)

CSV_FIELDS = ("productId", "method", "mae", "mape")


def _metric_text(value: Any, digits: int) -> str:
    if value is None:
        return ""
    return f"{float(value):.{digits}f}"


def evaluation_rows(
    *,
    input_path: Path,
    product_id: str | None,
    horizon_days: int,
    n_lags: int,
) -> list[dict[str, str]]:
    series = load_daily_demand(input_path, product_id=product_id)
    product_ids = list(series["productId"].drop_duplicates())
    rows: list[dict[str, str]] = []

    for pid in product_ids:
        product_series = series[series["productId"] == pid]
        for result in compare_product(
            product_series, horizon_days=horizon_days, n_lags=n_lags
        ):
            holdout = result.get("holdout") or {}
            if holdout.get("ok") is False:
                mae_text = ""
                mape_text = ""
            else:
                mae_text = _metric_text(holdout.get("mae"), 4)
                mape_text = _metric_text(holdout.get("mape"), 2)
            rows.append(
                {
                    "productId": pid,
                    "method": result["method"],
                    "mae": mae_text,
                    "mape": mape_text,
                }
            )
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(CSV_FIELDS))
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Export forecast holdout MAE/MAPE rows to CSV."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--product-id", default=None)
    parser.add_argument(
        "--horizon-days",
        type=int,
        default=DEFAULT_HORIZON_DAYS,
        choices=FORECAST_HORIZONS,
    )
    parser.add_argument("--n-lags", type=int, default=7)
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"CSV output path (default: {DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()

    rows = evaluation_rows(
        input_path=args.input,
        product_id=args.product_id,
        horizon_days=args.horizon_days,
        n_lags=args.n_lags,
    )
    write_csv(args.output, rows)

    print(
        f"Wrote {len(rows)} rows to {args.output}  "
        f"(horizonDays={args.horizon_days}, nLags={args.n_lags})"
    )
    for row in rows:
        mae = row["mae"] or "—"
        mape = row["mape"] or "—"
        print(f"  {row['productId']} | {row['method']}: mae={mae} mape={mape}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
