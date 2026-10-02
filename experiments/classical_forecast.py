"""Classical demand forecast baselines aligned with Smart-Chain Analytics.

Methods mirror microservices/analytics/services/forecastService.js:
  - moving average over a lookback window
  - simple exponential smoothing
  - one-step holdout evaluation with MAE and MAPE
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Sequence

from load_demand_history import load_daily_demand

FORECAST_HORIZONS = (7, 14, 30)
DEFAULT_HORIZON_DAYS = 7
DEFAULT_SMOOTHING_ALPHA = 0.3
SMOOTHING_MIN_POINTS = 7
EVAL_MIN_HISTORY_POINTS = 4
EVAL_MAX_HOLDOUT_DAYS = 3

WINDOW_BY_HORIZON = {
    7: 7,
    14: 14,
    30: 21,
}


def extract_quantities(history: Sequence[dict[str, Any]] | Sequence[float]) -> list[float]:
    """Pull daily quantities from history points or a bare numeric series."""
    if not history:
        return []

    first = history[0]
    if isinstance(first, (int, float)):
        return [float(value) for value in history]

    return [float(point.get("quantity", 0) or 0) for point in history]  # type: ignore[union-attr]


def nearest_horizon(value: Any) -> int:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return DEFAULT_HORIZON_DAYS
    if parsed <= 0:
        return DEFAULT_HORIZON_DAYS
    return min(FORECAST_HORIZONS, key=lambda horizon: abs(horizon - parsed))


def resolve_forecast_options(
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
) -> dict[str, float | int]:
    resolved_horizon = nearest_horizon(
        DEFAULT_HORIZON_DAYS if horizon_days is None else horizon_days
    )
    resolved_window = (
        int(window)
        if window is not None and int(window) > 0
        else WINDOW_BY_HORIZON[resolved_horizon]
    )
    resolved_alpha = (
        float(alpha)
        if alpha is not None and float(alpha) > 0
        else DEFAULT_SMOOTHING_ALPHA
    )
    return {
        "horizonDays": resolved_horizon,
        "window": resolved_window,
        "alpha": resolved_alpha,
    }


def mean_absolute_error(
    actuals: Sequence[float], predictions: Sequence[float]
) -> float | None:
    if not actuals or len(actuals) != len(predictions):
        return None
    total = sum(abs(actual - pred) for actual, pred in zip(actuals, predictions))
    return total / len(actuals)


def mean_absolute_percentage_error(
    actuals: Sequence[float], predictions: Sequence[float]
) -> float | None:
    if not actuals or len(actuals) != len(predictions):
        return None

    total = 0.0
    counted = 0
    for actual, pred in zip(actuals, predictions):
        if actual == 0:
            continue
        total += abs(actual - pred) / actual
        counted += 1

    if counted == 0:
        return None
    return (total / counted) * 100.0


def moving_average_forecast(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
) -> dict[str, Any]:
    options = resolve_forecast_options(horizon_days, window, alpha)
    quantities = extract_quantities(history)
    lookback = int(options["window"])

    if not quantities:
        return {
            "forecastMethod": "moving_average",
            "window": lookback,
            "alpha": None,
            "horizonDays": int(options["horizonDays"]),
            "averageDailyDemand": 0.0,
            "predictedDemand": 0.0,
            "pointsUsed": 0,
        }

    sample = quantities[-lookback:]
    average_daily = sum(sample) / len(sample)
    horizon = int(options["horizonDays"])
    return {
        "forecastMethod": "moving_average",
        "window": lookback,
        "alpha": None,
        "horizonDays": horizon,
        "averageDailyDemand": round(average_daily, 4),
        "predictedDemand": round(average_daily * horizon, 4),
        "pointsUsed": len(sample),
    }


def exponential_smoothing_forecast(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
) -> dict[str, Any]:
    options = resolve_forecast_options(horizon_days, window, alpha)
    quantities = extract_quantities(history)
    smoothing_alpha = float(options["alpha"])
    horizon = int(options["horizonDays"])

    if not quantities:
        return {
            "forecastMethod": "exponential_smoothing",
            "window": None,
            "alpha": smoothing_alpha,
            "horizonDays": horizon,
            "averageDailyDemand": 0.0,
            "predictedDemand": 0.0,
            "pointsUsed": 0,
        }

    smoothed = quantities[0]
    for value in quantities[1:]:
        smoothed = smoothing_alpha * value + (1.0 - smoothing_alpha) * smoothed

    return {
        "forecastMethod": "exponential_smoothing",
        "window": None,
        "alpha": smoothing_alpha,
        "horizonDays": horizon,
        "averageDailyDemand": round(smoothed, 4),
        "predictedDemand": round(smoothed * horizon, 4),
        "pointsUsed": len(quantities),
    }


def _predict_next_daily(
    train_history: Sequence[dict[str, Any]] | Sequence[float],
    options: dict[str, float | int],
) -> float:
    quantities = extract_quantities(train_history)
    if not quantities:
        return 0.0

    if len(quantities) >= SMOOTHING_MIN_POINTS:
        return float(
            exponential_smoothing_forecast(
                train_history,
                horizon_days=int(options["horizonDays"]),
                window=int(options["window"]),
                alpha=float(options["alpha"]),
            )["averageDailyDemand"]
        )

    return float(
        moving_average_forecast(
            train_history,
            horizon_days=int(options["horizonDays"]),
            window=int(options["window"]),
            alpha=float(options["alpha"]),
        )["averageDailyDemand"]
    )


def evaluate_forecast_holdout(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
    method: str = "auto",
) -> dict[str, Any] | None:
    """One-step holdout on the most recent days (same idea as the Node service).

    method:
      - "auto": MA when history is short, ES when long enough (Node default)
      - "moving_average"
      - "exponential_smoothing"
    """
    options = resolve_forecast_options(horizon_days, window, alpha)
    quantities = extract_quantities(history)

    if len(quantities) < EVAL_MIN_HISTORY_POINTS:
        return None

    holdout_days = min(
        EVAL_MAX_HOLDOUT_DAYS, max(1, len(quantities) // 4)
    )
    train_end = len(quantities) - holdout_days
    if train_end < 1:
        return None

    # Preserve point objects when available so sliced history stays consistent.
    if history and isinstance(history[0], dict):
        points: Sequence[Any] = history
    else:
        points = quantities

    actuals: list[float] = []
    predictions: list[float] = []

    for index in range(train_end, len(quantities)):
        train = points[:index]
        if method == "moving_average":
            predicted = float(
                moving_average_forecast(
                    train,
                    horizon_days=int(options["horizonDays"]),
                    window=int(options["window"]),
                    alpha=float(options["alpha"]),
                )["averageDailyDemand"]
            )
        elif method == "exponential_smoothing":
            predicted = float(
                exponential_smoothing_forecast(
                    train,
                    horizon_days=int(options["horizonDays"]),
                    window=int(options["window"]),
                    alpha=float(options["alpha"]),
                )["averageDailyDemand"]
            )
        else:
            predicted = _predict_next_daily(train, options)

        actuals.append(quantities[index])
        predictions.append(predicted)

    mae = mean_absolute_error(actuals, predictions)
    mape = mean_absolute_percentage_error(actuals, predictions)

    return {
        "holdoutDays": holdout_days,
        "pointsEvaluated": len(actuals),
        "mae": None if mae is None else round(mae, 4),
        "mape": None if mape is None else round(mape, 2),
        "method": method,
    }


def history_points_from_series(series_frame) -> list[dict[str, Any]]:
    """Convert a loader DataFrame slice into [{date, quantity}, ...]."""
    return [
        {"date": str(row.date), "quantity": float(row.quantity)}
        for row in series_frame.itertuples(index=False)
    ]


def run_baselines_for_product(
    series_frame,
    *,
    horizon_days: int = DEFAULT_HORIZON_DAYS,
) -> dict[str, Any]:
    history = history_points_from_series(series_frame)
    ma = moving_average_forecast(history, horizon_days=horizon_days)
    es = exponential_smoothing_forecast(history, horizon_days=horizon_days)
    return {
        "points": len(history),
        "moving_average": ma,
        "exponential_smoothing": es,
        "holdout_moving_average": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="moving_average"
        ),
        "holdout_exponential_smoothing": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="exponential_smoothing"
        ),
        "holdout_auto": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="auto"
        ),
    }


def _format_holdout(label: str, evaluation: dict[str, Any] | None) -> str:
    if evaluation is None:
        return f"  {label}: holdout unavailable (need >= {EVAL_MIN_HISTORY_POINTS} days)"
    return (
        f"  {label}: holdoutDays={evaluation['holdoutDays']}  "
        f"mae={evaluation['mae']}  mape={evaluation['mape']}"
    )


def main() -> int:
    default_data = Path(__file__).resolve().parent / "data" / "demo_daily_demand.json"
    parser = argparse.ArgumentParser(
        description="Run moving-average and exponential-smoothing baselines on demand history."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=default_data,
        help="Demand JSON/CSV path (default: data/demo_daily_demand.json)",
    )
    parser.add_argument(
        "--product-id",
        default=None,
        help="Optional productId filter (default: all products in the file)",
    )
    parser.add_argument(
        "--horizon-days",
        type=int,
        default=DEFAULT_HORIZON_DAYS,
        choices=FORECAST_HORIZONS,
        help="Forecast horizon in days (7, 14, or 30)",
    )
    args = parser.parse_args()

    series = load_daily_demand(args.input, product_id=args.product_id)
    product_ids = list(series["productId"].drop_duplicates())

    print(f"Classical baselines on {args.input}  horizonDays={args.horizon_days}")
    for product_id in product_ids:
        product_series = series[series["productId"] == product_id]
        result = run_baselines_for_product(
            product_series, horizon_days=args.horizon_days
        )
        ma = result["moving_average"]
        es = result["exponential_smoothing"]
        print(f"\nproductId={product_id}  historyDays={result['points']}")
        print(
            f"  MA: avgDaily={ma['averageDailyDemand']}  "
            f"predicted={ma['predictedDemand']}  window={ma['window']}"
        )
        print(
            f"  ES: avgDaily={es['averageDailyDemand']}  "
            f"predicted={es['predictedDemand']}  alpha={es['alpha']}"
        )
        print(_format_holdout("MA holdout", result["holdout_moving_average"]))
        print(_format_holdout("ES holdout", result["holdout_exponential_smoothing"]))
        print(_format_holdout("auto holdout", result["holdout_auto"]))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
