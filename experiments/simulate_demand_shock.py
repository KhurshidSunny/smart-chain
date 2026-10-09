"""Inject a demand spike into a demo series and compare forecast metrics before/after.

Shows how moving-average and exponential-smoothing holdout scores and predicted
demand shift when recent daily quantity jumps. Also reports a simple z-score on
the spiked day vs prior days (same idea as order-quantity anomaly flagging).
"""

from __future__ import annotations

import argparse
import math
from copy import deepcopy
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

DEFAULT_INPUT = Path(__file__).resolve().parent / "data" / "demo_daily_demand.json"
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[1] / "docs" / "demand-shock-simulation.md"
)
DEFAULT_PRODUCT_ID = "sku-rice-1kg"
DEFAULT_SPIKE_FACTOR = 3.0
DEFAULT_SPIKE_DAYS = 1


def _metric_cell(value: Any, digits: int = 4) -> str:
    if value is None:
        return "—"
    if isinstance(value, float):
        return f"{value:.{digits}f}"
    return str(value)


def _holdout_cells(evaluation: dict[str, Any] | None) -> tuple[str, str]:
    if evaluation is None:
        return ("—", "—")
    return (_metric_cell(evaluation.get("mae")), _metric_cell(evaluation.get("mape"), 2))


def series_zscore_last_day(history: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Z-score of the latest day vs all earlier days (needs 3+ prior points)."""
    if len(history) < 4:
        return None
    prior = [float(point["quantity"]) for point in history[:-1]]
    last = float(history[-1]["quantity"])
    mean = sum(prior) / len(prior)
    variance = sum((value - mean) ** 2 for value in prior) / len(prior)
    std = math.sqrt(variance)
    if std == 0:
        return {
            "date": history[-1]["date"],
            "quantity": last,
            "peerMean": round(mean, 4),
            "peerStd": 0.0,
            "zScore": None,
            "reason": "zero variance in prior days",
        }
    z_score = (last - mean) / std
    return {
        "date": history[-1]["date"],
        "quantity": last,
        "peerMean": round(mean, 4),
        "peerStd": round(std, 4),
        "zScore": round(z_score, 4),
        "reason": None,
    }


def apply_spike(
    history: list[dict[str, Any]],
    *,
    spike_factor: float,
    spike_days: int,
) -> list[dict[str, Any]]:
    """Multiply the last `spike_days` quantities by `spike_factor` (in-memory copy)."""
    if spike_factor <= 0:
        raise ValueError("spike_factor must be positive")
    if spike_days < 1:
        raise ValueError("spike_days must be >= 1")
    if spike_days > len(history):
        raise ValueError("spike_days cannot exceed series length")

    shocked = deepcopy(history)
    start = len(shocked) - spike_days
    for index in range(start, len(shocked)):
        shocked[index]["quantity"] = round(
            float(shocked[index]["quantity"]) * spike_factor, 4
        )
    return shocked


def evaluate_series(
    history: list[dict[str, Any]],
    *,
    horizon_days: int,
) -> dict[str, Any]:
    ma = moving_average_forecast(history, horizon_days=horizon_days)
    es = exponential_smoothing_forecast(history, horizon_days=horizon_days)
    return {
        "historyDays": len(history),
        "lastDate": history[-1]["date"] if history else None,
        "lastQuantity": history[-1]["quantity"] if history else None,
        "moving_average": ma,
        "exponential_smoothing": es,
        "holdout_ma": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="moving_average"
        ),
        "holdout_es": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="exponential_smoothing"
        ),
        "last_day_zscore": series_zscore_last_day(history),
    }


def render_markdown(
    *,
    input_path: Path,
    product_id: str,
    horizon_days: int,
    spike_factor: float,
    spike_days: int,
    baseline: dict[str, Any],
    shocked: dict[str, Any],
) -> str:
    try:
        repo_root = Path(__file__).resolve().parents[1]
        input_display = input_path.resolve().relative_to(repo_root).as_posix()
    except ValueError:
        input_display = input_path.name

    ma_mae_b, ma_mape_b = _holdout_cells(baseline["holdout_ma"])
    es_mae_b, es_mape_b = _holdout_cells(baseline["holdout_es"])
    ma_mae_s, ma_mape_s = _holdout_cells(shocked["holdout_ma"])
    es_mae_s, es_mape_s = _holdout_cells(shocked["holdout_es"])

    z_b = baseline["last_day_zscore"] or {}
    z_s = shocked["last_day_zscore"] or {}

    lines = [
        "# Demand shock simulation",
        "",
        "Offline stress check for Smart-Chain analytics: inject a sudden jump into",
        "the end of a demo daily-demand series, then compare classical forecast",
        "outputs and a simple last-day z-score before and after the spike.",
        "",
        "## Setup",
        "",
        f"- Input: `{input_display}`",
        f"- Product: `{product_id}`",
        f"- Horizon: **{horizon_days}** days",
        f"- Spike: multiply the last **{spike_days}** day(s) by **{spike_factor:g}×**",
        "- Forecast methods match `microservices/analytics/services/forecastService.js`",
        "",
        "## Series snapshot",
        "",
        "| Scenario | History days | Last date | Last quantity |",
        "|---|---:|---|---:|",
        (
            f"| Baseline | {baseline['historyDays']} | {baseline['lastDate']} | "
            f"{_metric_cell(baseline['lastQuantity'])} |"
        ),
        (
            f"| After spike | {shocked['historyDays']} | {shocked['lastDate']} | "
            f"{_metric_cell(shocked['lastQuantity'])} |"
        ),
        "",
        "## Forecast before vs after",
        "",
        "| Method | Scenario | Avg daily (fit) | Predicted demand | Holdout MAE | Holdout MAPE (%) |",
        "|---|---|---:|---:|---:|---:|",
        (
            f"| Moving average | Baseline | "
            f"{_metric_cell(baseline['moving_average']['averageDailyDemand'])} | "
            f"{_metric_cell(baseline['moving_average']['predictedDemand'])} | "
            f"{ma_mae_b} | {ma_mape_b} |"
        ),
        (
            f"| Moving average | After spike | "
            f"{_metric_cell(shocked['moving_average']['averageDailyDemand'])} | "
            f"{_metric_cell(shocked['moving_average']['predictedDemand'])} | "
            f"{ma_mae_s} | {ma_mape_s} |"
        ),
        (
            f"| Exponential smoothing | Baseline | "
            f"{_metric_cell(baseline['exponential_smoothing']['averageDailyDemand'])} | "
            f"{_metric_cell(baseline['exponential_smoothing']['predictedDemand'])} | "
            f"{es_mae_b} | {es_mape_b} |"
        ),
        (
            f"| Exponential smoothing | After spike | "
            f"{_metric_cell(shocked['exponential_smoothing']['averageDailyDemand'])} | "
            f"{_metric_cell(shocked['exponential_smoothing']['predictedDemand'])} | "
            f"{es_mae_s} | {es_mape_s} |"
        ),
        "",
        "## Last-day z-score (series analogue of order-size anomaly)",
        "",
        "Uses prior days in the same product series as the peer set (needs 3+ prior days).",
        "The live service applies z-score to order-line quantities, not daily aggregates;",
        "this table only shows how a sudden jump stands out on the demo series.",
        "",
        "| Scenario | Date | Quantity | Peer mean | Peer std | Z-score |",
        "|---|---|---:|---:|---:|---:|",
        (
            f"| Baseline | {z_b.get('date', '—')} | {_metric_cell(z_b.get('quantity'))} | "
            f"{_metric_cell(z_b.get('peerMean'))} | {_metric_cell(z_b.get('peerStd'))} | "
            f"{_metric_cell(z_b.get('zScore'))} |"
        ),
        (
            f"| After spike | {z_s.get('date', '—')} | {_metric_cell(z_s.get('quantity'))} | "
            f"{_metric_cell(z_s.get('peerMean'))} | {_metric_cell(z_s.get('peerStd'))} | "
            f"{_metric_cell(z_s.get('zScore'))} |"
        ),
        "",
        "## Interpretation",
        "",
        "- After the spike, both MA and ES raise average daily demand and predicted demand;",
        "  ES reacts more when the jump is on the most recent day (higher weight on the latest observation).",
        "- Holdout MAE/MAPE often worsen when the holdout window includes the spiked day,",
        "  because earlier history no longer matches the jump.",
        "- The last-day z-score rises sharply after the spike, which matches the idea behind",
        "  the live order-quantity anomaly badge (unusual size vs same-product history).",
        "",
        "## Limits",
        "",
        "- Synthetic demo series only; one product and one spike factor.",
        "- Spike is applied in memory; the input JSON file is not modified.",
        "- Not a production stress test or claim about retail-scale demand shocks.",
        "",
        "## How to regenerate",
        "",
        "```powershell",
        "cd experiments",
        "python simulate_demand_shock.py --write-md",
        "python simulate_demand_shock.py --product-id sku-oil-1l --spike-factor 4 --write-md",
        "```",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compare forecast metrics before and after an injected demand spike."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--product-id", default=DEFAULT_PRODUCT_ID)
    parser.add_argument(
        "--horizon-days",
        type=int,
        default=DEFAULT_HORIZON_DAYS,
        choices=FORECAST_HORIZONS,
    )
    parser.add_argument(
        "--spike-factor",
        type=float,
        default=DEFAULT_SPIKE_FACTOR,
        help="Multiply the last spike-days quantities by this factor (default 3).",
    )
    parser.add_argument(
        "--spike-days",
        type=int,
        default=DEFAULT_SPIKE_DAYS,
        help="How many trailing days to spike (default 1).",
    )
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

    frame = load_daily_demand(args.input, product_id=args.product_id)
    if frame.empty:
        raise SystemExit(f"No rows for productId={args.product_id} in {args.input}")

    baseline_history = history_points_from_series(frame)
    shocked_history = apply_spike(
        baseline_history,
        spike_factor=args.spike_factor,
        spike_days=args.spike_days,
    )

    baseline = evaluate_series(baseline_history, horizon_days=args.horizon_days)
    shocked = evaluate_series(shocked_history, horizon_days=args.horizon_days)

    print(
        f"Demand shock on {args.product_id}  "
        f"factor={args.spike_factor:g}x  days={args.spike_days}  "
        f"horizonDays={args.horizon_days}"
    )
    print(
        f"  last qty: {baseline['lastQuantity']} -> {shocked['lastQuantity']}  "
        f"({baseline['lastDate']})"
    )
    for label, result in (("baseline", baseline), ("after spike", shocked)):
        ma = result["moving_average"]
        es = result["exponential_smoothing"]
        ma_mae, ma_mape = _holdout_cells(result["holdout_ma"])
        es_mae, es_mape = _holdout_cells(result["holdout_es"])
        z = result["last_day_zscore"] or {}
        print(
            f"  [{label}] MA avgDaily={ma['averageDailyDemand']} "
            f"pred={ma['predictedDemand']} mae={ma_mae} mape={ma_mape}"
        )
        print(
            f"  [{label}] ES avgDaily={es['averageDailyDemand']} "
            f"pred={es['predictedDemand']} mae={es_mae} mape={es_mape}"
        )
        print(f"  [{label}] last-day z={_metric_cell(z.get('zScore'))}")

    markdown = render_markdown(
        input_path=args.input,
        product_id=args.product_id,
        horizon_days=args.horizon_days,
        spike_factor=args.spike_factor,
        spike_days=args.spike_days,
        baseline=baseline,
        shocked=shocked,
    )

    if args.write_md:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(markdown, encoding="utf-8")
        print(f"\nWrote {args.output}")
    else:
        print("\n--- markdown preview ---\n")
        print(markdown)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
