"""Compare MA, exponential smoothing, and sklearn lag forecasts on the same holdout.

Writes a markdown results table suitable for scholarship / portfolio documentation.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from classical_forecast import (
    DEFAULT_HORIZON_DAYS,
    FORECAST_HORIZONS,
    evaluate_forecast_holdout,
    exponential_smoothing_forecast,
    history_points_from_series,
    moving_average_forecast,
)
from load_demand_history import load_daily_demand
from sklearn_lag_forecast import evaluate_sklearn_lag_holdout, sklearn_lag_forecast

DEFAULT_INPUT = Path(__file__).resolve().parent / "data" / "demo_daily_demand.json"
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[1] / "docs" / "forecast-comparison-results.md"
)


def _holdout_cells(evaluation: dict[str, Any] | None) -> tuple[str, str, str]:
    if evaluation is None:
        return ("—", "—", "too short for holdout")
    if evaluation.get("ok") is False:
        return ("—", "—", evaluation.get("reason") or "skipped")
    mae = evaluation.get("mae")
    mape = evaluation.get("mape")
    mae_text = "—" if mae is None else f"{mae:.4f}"
    mape_text = "—" if mape is None else f"{mape:.2f}"
    note = f"holdoutDays={evaluation.get('holdoutDays')}, points={evaluation.get('pointsEvaluated')}"
    return (mae_text, mape_text, note)


def compare_product(
    series_frame,
    *,
    horizon_days: int,
    n_lags: int,
) -> list[dict[str, Any]]:
    history = history_points_from_series(series_frame)
    history_days = len(history)

    ma_forecast = moving_average_forecast(history, horizon_days=horizon_days)
    es_forecast = exponential_smoothing_forecast(history, horizon_days=horizon_days)
    sk_forecast = sklearn_lag_forecast(
        history,
        horizon_days=horizon_days,
        n_lags=n_lags,
        model_name="ridge",
    )

    ma_holdout = evaluate_forecast_holdout(
        history, horizon_days=horizon_days, method="moving_average"
    )
    es_holdout = evaluate_forecast_holdout(
        history, horizon_days=horizon_days, method="exponential_smoothing"
    )
    sk_holdout = evaluate_sklearn_lag_holdout(
        history, horizon_days=horizon_days, n_lags=n_lags, model_name="ridge"
    )

    rows = [
        {
            "method": "Moving average",
            "historyDays": history_days,
            "avgDaily": ma_forecast["averageDailyDemand"],
            "holdout": ma_holdout,
            "notes": f"window={ma_forecast['window']}",
        },
        {
            "method": "Exponential smoothing",
            "historyDays": history_days,
            "avgDaily": es_forecast["averageDailyDemand"],
            "holdout": es_holdout,
            "notes": f"alpha={es_forecast['alpha']}",
        },
        {
            "method": "Sklearn lag (Ridge)",
            "historyDays": history_days,
            "avgDaily": sk_forecast.get("averageDailyDemand"),
            "holdout": sk_holdout,
            "notes": (
                sk_forecast.get("reason")
                if not sk_forecast.get("ok")
                else f"nLags={n_lags}, trainRows={sk_forecast.get('trainRows')}"
            ),
        },
    ]
    return rows


def render_markdown(
    *,
    input_path: Path,
    horizon_days: int,
    n_lags: int,
    product_blocks: list[tuple[str, list[dict[str, Any]]]],
) -> str:
    try:
        repo_root = Path(__file__).resolve().parents[1]
        input_display = input_path.resolve().relative_to(repo_root).as_posix()
    except ValueError:
        input_display = input_path.name

    lines: list[str] = [
        "# Forecast method comparison",
        "",
        "Offline comparison of classical and supervised demand baselines used with",
        "Smart-Chain analytics experiments. All methods use the same daily demand",
        "history and the same short one-step holdout protocol (recent days held out,",
        "refit on earlier history, score MAE / MAPE).",
        "",
        "## Setup",
        "",
        f"- Input: `{input_display}`",
        f"- Horizon: **{horizon_days}** days",
        f"- Sklearn lags: **{n_lags}** (+ rolling mean feature)",
        "- Classical methods match `microservices/analytics/services/forecastService.js`",
        "",
    ]

    for product_id, rows in product_blocks:
        lines.extend(
            [
                f"## Product `{product_id}`",
                "",
                "| Method | History days | Avg daily (fit) | MAE | MAPE (%) | Notes |",
                "|---|---:|---:|---:|---:|---|",
            ]
        )
        for row in rows:
            mae, mape, holdout_note = _holdout_cells(row["holdout"])
            avg = "—" if row["avgDaily"] is None else f"{row['avgDaily']:.4f}"
            notes = f"{row['notes']}; {holdout_note}"
            lines.append(
                f"| {row['method']} | {row['historyDays']} | {avg} | {mae} | {mape} | {notes} |"
            )
        lines.append("")

    # Best method by MAE where available
    lines.extend(["## Interpretation", ""])
    for product_id, rows in product_blocks:
        scored = []
        for row in rows:
            holdout = row["holdout"] or {}
            mae = holdout.get("mae")
            if mae is None:
                continue
            if holdout.get("ok") is False:
                continue
            scored.append((mae, row["method"]))
        if not scored:
            lines.append(
                f"- `{product_id}`: no comparable holdout scores (series too short for some methods)."
            )
            continue
        scored.sort(key=lambda item: item[0])
        best_mae, best_name = scored[0]
        lines.append(
            f"- `{product_id}`: lowest holdout MAE on this demo file was **{best_name}** "
            f"(MAE={best_mae:.4f}). Rankings can change with longer or noisier series."
        )

    lines.extend(
        [
            "",
            "## Limits",
            "",
            "- Demo data only (synthetic daily demand in `experiments/data/`).",
            "- Holdout windows are short by design (aligned with the live Analytics service).",
            "- Sklearn needs enough history to build lag rows; very short SKUs are skipped.",
            "- This is decision-support evaluation, not a claim of production deep learning.",
            "",
            "## How to regenerate",
            "",
            "```powershell",
            "cd experiments",
            "python compare_forecast_methods.py",
            "python compare_forecast_methods.py --product-id sku-rice-1kg --write-md",
            "```",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compare MA, ES, and sklearn lag forecasts; optionally write markdown results."
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
        "--write-md",
        action="store_true",
        help=f"Write results markdown to {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Markdown output path (used with --write-md)",
    )
    args = parser.parse_args()

    series = load_daily_demand(args.input, product_id=args.product_id)
    product_ids = list(series["productId"].drop_duplicates())
    product_blocks: list[tuple[str, list[dict[str, Any]]]] = []

    print(
        f"Comparing methods on {args.input}  "
        f"horizonDays={args.horizon_days}  nLags={args.n_lags}"
    )

    for product_id in product_ids:
        product_series = series[series["productId"] == product_id]
        rows = compare_product(
            product_series, horizon_days=args.horizon_days, n_lags=args.n_lags
        )
        product_blocks.append((product_id, rows))
        print(f"\nproductId={product_id}")
        for row in rows:
            mae, mape, note = _holdout_cells(row["holdout"])
            avg = "—" if row["avgDaily"] is None else f"{row['avgDaily']:.4f}"
            print(
                f"  {row['method']}: avgDaily={avg}  mae={mae}  mape={mape}  ({note})"
            )

    markdown = render_markdown(
        input_path=args.input,
        horizon_days=args.horizon_days,
        n_lags=args.n_lags,
        product_blocks=product_blocks,
    )

    if args.write_md:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(markdown, encoding="utf-8")
        print(f"\nWrote {args.output}")
    else:
        # Still useful to preview in the terminal when not writing.
        print("\n--- markdown preview ---\n")
        print(markdown)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
