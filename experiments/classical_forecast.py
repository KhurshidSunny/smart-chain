"""Classical demand forecast baselines aligned with Smart-Chain Analytics.

Methods mirror microservices/analytics/services/forecastService.js:
  - moving average over a lookback window
  - simple exponential smoothing
  - Croston for intermittent (sparse / zero-heavy) demand
  - one-step holdout evaluation with MAE and MAPE
  - residual-based approx. 80% uncertainty band + operator explanation
"""

from __future__ import annotations

import argparse
from math import sqrt
from pathlib import Path
from typing import Any, Sequence

from load_demand_history import load_daily_demand

FORECAST_HORIZONS = (7, 14, 30)
DEFAULT_HORIZON_DAYS = 7
DEFAULT_SMOOTHING_ALPHA = 0.3
SMOOTHING_MIN_POINTS = 7
EVAL_MIN_HISTORY_POINTS = 4
EVAL_MAX_HOLDOUT_DAYS = 3
INTERMITTENT_ZERO_RATIO = 0.4
CROSTON_MIN_DEMAND_EVENTS = 2
UNCERTAINTY_Z_80 = 1.28155
UNCERTAINTY_MIN_RESIDUALS = 3

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


def count_demand_events(quantities: Sequence[float]) -> int:
    return sum(1 for value in quantities if value > 0)


def zero_day_ratio(quantities: Sequence[float]) -> float:
    if not quantities:
        return 0.0
    zeros = sum(1 for value in quantities if value == 0)
    return zeros / len(quantities)


def is_intermittent_series(quantities: Sequence[float]) -> bool:
    return (
        len(quantities) >= EVAL_MIN_HISTORY_POINTS
        and count_demand_events(quantities) >= CROSTON_MIN_DEMAND_EVENTS
        and zero_day_ratio(quantities) >= INTERMITTENT_ZERO_RATIO
    )


def croston_forecast(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
) -> dict[str, Any]:
    """Croston intermittent demand: smooth size and inter-demand interval."""
    options = resolve_forecast_options(horizon_days, window, alpha)
    quantities = extract_quantities(history)
    smoothing_alpha = float(options["alpha"])
    horizon = int(options["horizonDays"])
    events = count_demand_events(quantities)
    ratio = zero_day_ratio(quantities)

    if not quantities or events == 0:
        return {
            "forecastMethod": "croston",
            "window": None,
            "alpha": smoothing_alpha,
            "horizonDays": horizon,
            "averageDailyDemand": 0.0,
            "predictedDemand": 0.0,
            "pointsUsed": len(quantities),
            "demandEvents": 0,
            "zeroDayRatio": round(ratio, 4),
        }

    smoothed_size: float | None = None
    smoothed_interval: float | None = None
    periods_since_demand = 0

    for demand in quantities:
        periods_since_demand += 1
        if demand <= 0:
            continue
        if smoothed_size is None:
            smoothed_size = demand
            smoothed_interval = float(periods_since_demand)
        else:
            smoothed_size = (
                smoothing_alpha * demand + (1.0 - smoothing_alpha) * smoothed_size
            )
            smoothed_interval = (
                smoothing_alpha * periods_since_demand
                + (1.0 - smoothing_alpha) * smoothed_interval
            )
        periods_since_demand = 0

    assert smoothed_size is not None and smoothed_interval is not None
    interval = smoothed_interval if smoothed_interval > 0 else 1.0
    average_daily = smoothed_size / interval

    return {
        "forecastMethod": "croston",
        "window": None,
        "alpha": smoothing_alpha,
        "horizonDays": horizon,
        "averageDailyDemand": round(average_daily, 4),
        "predictedDemand": round(average_daily * horizon, 4),
        "pointsUsed": len(quantities),
        "demandEvents": events,
        "zeroDayRatio": round(ratio, 4),
    }


def _predict_next_daily(
    train_history: Sequence[dict[str, Any]] | Sequence[float],
    options: dict[str, float | int],
    method: str = "auto",
) -> float:
    quantities = extract_quantities(train_history)
    if not quantities:
        return 0.0

    kwargs = {
        "horizon_days": int(options["horizonDays"]),
        "window": int(options["window"]),
        "alpha": float(options["alpha"]),
    }

    if method == "moving_average":
        return float(moving_average_forecast(train_history, **kwargs)["averageDailyDemand"])
    if method == "exponential_smoothing":
        return float(
            exponential_smoothing_forecast(train_history, **kwargs)["averageDailyDemand"]
        )
    if method == "croston":
        return float(croston_forecast(train_history, **kwargs)["averageDailyDemand"])

    if is_intermittent_series(quantities):
        return float(croston_forecast(train_history, **kwargs)["averageDailyDemand"])
    if len(quantities) >= SMOOTHING_MIN_POINTS:
        return float(
            exponential_smoothing_forecast(train_history, **kwargs)["averageDailyDemand"]
        )
    return float(moving_average_forecast(train_history, **kwargs)["averageDailyDemand"])


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
      - "auto": Croston when intermittent; else ES when long enough, else MA
      - "moving_average"
      - "exponential_smoothing"
      - "croston"
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
        predicted = _predict_next_daily(train, options, method=method)
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


def collect_one_step_residuals(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
    method: str = "auto",
) -> list[float]:
    options = resolve_forecast_options(horizon_days, window, alpha)
    quantities = extract_quantities(history)
    if len(quantities) < EVAL_MIN_HISTORY_POINTS:
        return []

    if history and isinstance(history[0], dict):
        points: Sequence[Any] = history
    else:
        points = quantities

    residuals: list[float] = []
    start_index = max(1, EVAL_MIN_HISTORY_POINTS - 1)
    for index in range(start_index, len(quantities)):
        predicted = _predict_next_daily(points[:index], options, method=method)
        residuals.append(quantities[index] - predicted)
    return residuals


def compute_forecast_uncertainty(
    history: Sequence[dict[str, Any]] | Sequence[float],
    forecast: dict[str, Any],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
) -> dict[str, Any] | None:
    """Approx. 80% residual band around horizon total demand (matches Node service)."""
    method = str(forecast.get("forecastMethod") or "auto")
    residuals = collect_one_step_residuals(
        history,
        horizon_days=horizon_days,
        window=window,
        alpha=alpha,
        method=method,
    )
    daily_scale: float | None = None
    residual_count = len(residuals)
    scale_source = "residual_std"

    if residuals:
        mean = sum(residuals) / len(residuals)
        variance = sum((value - mean) ** 2 for value in residuals) / len(residuals)
        daily_scale = sqrt(variance)

    evaluation = forecast.get("evaluation")
    if (
        (daily_scale is None or residual_count < UNCERTAINTY_MIN_RESIDUALS)
        and isinstance(evaluation, dict)
        and evaluation.get("mae") is not None
    ):
        daily_scale = float(evaluation["mae"]) / 0.79788456
        residual_count = int(evaluation.get("pointsEvaluated") or residual_count)
        scale_source = "holdout_mae"

    if daily_scale is None:
        return None

    horizon = int(forecast.get("horizonDays") or DEFAULT_HORIZON_DAYS)
    half_width = UNCERTAINTY_Z_80 * daily_scale * sqrt(horizon)
    predicted = float(forecast.get("predictedDemand") or 0.0)
    lower = max(0.0, predicted - half_width)
    upper = predicted + half_width

    return {
        "level": 0.8,
        "lower": round(lower, 4),
        "upper": round(upper, 4),
        "halfWidth": round(half_width, 4),
        "residualStd": round(daily_scale, 4),
        "residualCount": residual_count,
        "scaleSource": scale_source,
        "method": "residual_band",
    }


def build_forecast_explanation(
    forecast: dict[str, Any], quantities: Sequence[float]
) -> str:
    method = forecast.get("forecastMethod")
    points = len(quantities)
    parts: list[str] = []

    if method == "croston":
        ratio = float(forecast.get("zeroDayRatio") or zero_day_ratio(quantities))
        events = int(forecast.get("demandEvents") or count_demand_events(quantities))
        parts.append(
            f"Selected Croston because demand is intermittent "
            f"({round(ratio * 100)}% zero days; {events} demand events). "
            "Non-zero size and inter-demand interval are smoothed separately."
        )
    elif method == "exponential_smoothing":
        parts.append(
            f"Selected exponential smoothing (alpha={forecast.get('alpha')}) "
            f"on {points} history days."
        )
    elif method == "moving_average":
        parts.append(
            f"Selected moving average over the last {forecast.get('window')} days "
            f"(short or dense history; {points} points available)."
        )
    else:
        parts.append("Forecast method could not be selected for this series.")

    uncertainty = forecast.get("uncertainty")
    if isinstance(uncertainty, dict):
        parts.append(
            f"Approx. {round(float(uncertainty['level']) * 100)}% residual band "
            f"{uncertainty['lower']}-{uncertainty['upper']} units over "
            f"{forecast.get('horizonDays')} days "
            "(demo-scale one-step errors; not a calibrated probabilistic forecast)."
        )
    else:
        parts.append(
            "Uncertainty band unavailable until more demand history accumulates."
        )

    return " ".join(parts)


def select_forecast_method(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    window: int | None = None,
    alpha: float | None = None,
) -> dict[str, Any]:
    """Live-path selector: Croston / ES / MA + evaluation + uncertainty + explanation."""
    quantities = extract_quantities(history)
    kwargs = {
        "horizon_days": horizon_days,
        "window": window,
        "alpha": alpha,
    }

    if is_intermittent_series(quantities):
        forecast = croston_forecast(history, **kwargs)
    elif len(quantities) >= SMOOTHING_MIN_POINTS:
        forecast = exponential_smoothing_forecast(history, **kwargs)
    else:
        forecast = moving_average_forecast(history, **kwargs)

    evaluation = evaluate_forecast_holdout(
        history, **kwargs, method=str(forecast["forecastMethod"])
    )
    with_evaluation = {**forecast, "evaluation": evaluation}
    uncertainty = compute_forecast_uncertainty(history, with_evaluation, **kwargs)
    with_uncertainty = {**with_evaluation, "uncertainty": uncertainty}
    return {
        **with_uncertainty,
        "explanation": build_forecast_explanation(with_uncertainty, quantities),
    }


def run_baselines_for_product(
    series_frame,
    *,
    horizon_days: int = DEFAULT_HORIZON_DAYS,
) -> dict[str, Any]:
    history = history_points_from_series(series_frame)
    quantities = extract_quantities(history)
    ma = moving_average_forecast(history, horizon_days=horizon_days)
    es = exponential_smoothing_forecast(history, horizon_days=horizon_days)
    croston = croston_forecast(history, horizon_days=horizon_days)
    selected = select_forecast_method(history, horizon_days=horizon_days)
    return {
        "points": len(history),
        "intermittent": is_intermittent_series(quantities),
        "moving_average": ma,
        "exponential_smoothing": es,
        "croston": croston,
        "selected": selected,
        "holdout_moving_average": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="moving_average"
        ),
        "holdout_exponential_smoothing": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="exponential_smoothing"
        ),
        "holdout_croston": evaluate_forecast_holdout(
            history, horizon_days=horizon_days, method="croston"
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
        description=(
            "Run moving-average, exponential-smoothing, and Croston baselines "
            "on demand history."
        )
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
        croston = result["croston"]
        print(
            f"\nproductId={product_id}  historyDays={result['points']}  "
            f"intermittent={result['intermittent']}"
        )
        print(
            f"  MA: avgDaily={ma['averageDailyDemand']}  "
            f"predicted={ma['predictedDemand']}  window={ma['window']}"
        )
        print(
            f"  ES: avgDaily={es['averageDailyDemand']}  "
            f"predicted={es['predictedDemand']}  alpha={es['alpha']}"
        )
        print(
            f"  Croston: avgDaily={croston['averageDailyDemand']}  "
            f"predicted={croston['predictedDemand']}  "
            f"events={croston['demandEvents']}  zeroRatio={croston['zeroDayRatio']}"
        )
        print(_format_holdout("MA holdout", result["holdout_moving_average"]))
        print(_format_holdout("ES holdout", result["holdout_exponential_smoothing"]))
        print(_format_holdout("Croston holdout", result["holdout_croston"]))
        print(_format_holdout("auto holdout", result["holdout_auto"]))
        selected = result["selected"]
        uncertainty = selected.get("uncertainty")
        band = (
            f"{uncertainty['lower']}-{uncertainty['upper']}"
            if isinstance(uncertainty, dict)
            else "n/a"
        )
        print(
            f"  selected: method={selected['forecastMethod']}  "
            f"predicted={selected['predictedDemand']}  band={band}"
        )
        print(f"  explanation: {selected.get('explanation')}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
