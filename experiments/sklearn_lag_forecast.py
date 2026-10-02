"""Supervised lag-feature demand forecast baseline (scikit-learn).

Builds lag features from daily demand and fits a simple regressor so results
can be compared against moving average and exponential smoothing on the same
holdout protocol used in classical_forecast.py.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Sequence

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge

from classical_forecast import (
    DEFAULT_HORIZON_DAYS,
    EVAL_MAX_HOLDOUT_DAYS,
    EVAL_MIN_HISTORY_POINTS,
    FORECAST_HORIZONS,
    extract_quantities,
    history_points_from_series,
    mean_absolute_error,
    mean_absolute_percentage_error,
    nearest_horizon,
)
from load_demand_history import load_daily_demand

DEFAULT_N_LAGS = 7
DEFAULT_MODEL = "ridge"
MIN_TRAIN_ROWS = 3


def build_lag_feature_matrix(
    quantities: Sequence[float],
    *,
    n_lags: int = DEFAULT_N_LAGS,
    include_rolling_mean: bool = True,
) -> tuple[np.ndarray, np.ndarray] | None:
    """Create supervised rows: predict day t from lags t-1 ... t-n_lags.

    Returns (X, y) or None when the series is too short to form any row.
    """
    values = [float(value) for value in quantities]
    if n_lags < 1:
        raise ValueError("n_lags must be >= 1")
    if len(values) <= n_lags:
        return None

    rows: list[list[float]] = []
    targets: list[float] = []

    for index in range(n_lags, len(values)):
        lags = [values[index - lag] for lag in range(1, n_lags + 1)]
        features = list(lags)
        if include_rolling_mean:
            features.append(sum(lags) / len(lags))
        rows.append(features)
        targets.append(values[index])

    return np.asarray(rows, dtype=float), np.asarray(targets, dtype=float)


def _make_model(model_name: str, random_state: int = 42):
    name = model_name.lower().strip()
    if name == "ridge":
        return Ridge(alpha=1.0)
    if name in {"rf", "random_forest", "randomforest"}:
        return RandomForestRegressor(
            n_estimators=100,
            max_depth=4,
            random_state=random_state,
        )
    raise ValueError("model must be 'ridge' or 'random_forest'")


def sklearn_lag_forecast(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    n_lags: int = DEFAULT_N_LAGS,
    include_rolling_mean: bool = True,
    model_name: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    """Fit on the full series and forecast average daily demand for a horizon."""
    horizon = nearest_horizon(
        DEFAULT_HORIZON_DAYS if horizon_days is None else horizon_days
    )
    quantities = extract_quantities(history)
    built = build_lag_feature_matrix(
        quantities, n_lags=n_lags, include_rolling_mean=include_rolling_mean
    )

    if built is None:
        return {
            "forecastMethod": f"sklearn_lag_{model_name}",
            "ok": False,
            "reason": (
                f"Need more than {n_lags} daily points to build lag features "
                f"(have {len(quantities)})."
            ),
            "nLags": n_lags,
            "includeRollingMean": include_rolling_mean,
            "horizonDays": horizon,
            "averageDailyDemand": None,
            "predictedDemand": None,
            "trainRows": 0,
            "pointsUsed": len(quantities),
        }

    features, targets = built
    if len(targets) < MIN_TRAIN_ROWS:
        return {
            "forecastMethod": f"sklearn_lag_{model_name}",
            "ok": False,
            "reason": (
                f"Need at least {MIN_TRAIN_ROWS} supervised rows after lagging "
                f"(have {len(targets)})."
            ),
            "nLags": n_lags,
            "includeRollingMean": include_rolling_mean,
            "horizonDays": horizon,
            "averageDailyDemand": None,
            "predictedDemand": None,
            "trainRows": int(len(targets)),
            "pointsUsed": len(quantities),
        }

    model = _make_model(model_name)
    model.fit(features, targets)

    # One-step prediction from the most recent lags, then scale by horizon.
    latest = features[-1].reshape(1, -1)
    average_daily = float(model.predict(latest)[0])
    average_daily = max(0.0, average_daily)

    return {
        "forecastMethod": f"sklearn_lag_{model_name}",
        "ok": True,
        "reason": None,
        "nLags": n_lags,
        "includeRollingMean": include_rolling_mean,
        "horizonDays": horizon,
        "averageDailyDemand": round(average_daily, 4),
        "predictedDemand": round(average_daily * horizon, 4),
        "trainRows": int(len(targets)),
        "pointsUsed": len(quantities),
    }


def evaluate_sklearn_lag_holdout(
    history: Sequence[dict[str, Any]] | Sequence[float],
    *,
    horizon_days: int | None = None,
    n_lags: int = DEFAULT_N_LAGS,
    include_rolling_mean: bool = True,
    model_name: str = DEFAULT_MODEL,
) -> dict[str, Any] | None:
    """One-step holdout matching classical_forecast.evaluate_forecast_holdout."""
    _ = horizon_days  # kept for a consistent call signature with classical helpers
    quantities = extract_quantities(history)

    if len(quantities) < EVAL_MIN_HISTORY_POINTS:
        return None

    holdout_days = min(EVAL_MAX_HOLDOUT_DAYS, max(1, len(quantities) // 4))
    train_end = len(quantities) - holdout_days
    if train_end < 1:
        return None

    actuals: list[float] = []
    predictions: list[float] = []
    skipped = 0

    for index in range(train_end, len(quantities)):
        train_quantities = quantities[:index]
        built = build_lag_feature_matrix(
            train_quantities,
            n_lags=n_lags,
            include_rolling_mean=include_rolling_mean,
        )
        if built is None or len(built[1]) < MIN_TRAIN_ROWS:
            skipped += 1
            continue

        features, targets = built
        model = _make_model(model_name)
        model.fit(features, targets)
        predicted = float(model.predict(features[-1].reshape(1, -1))[0])
        predicted = max(0.0, predicted)

        actuals.append(quantities[index])
        predictions.append(predicted)

    if not actuals:
        return {
            "holdoutDays": holdout_days,
            "pointsEvaluated": 0,
            "mae": None,
            "mape": None,
            "method": f"sklearn_lag_{model_name}",
            "skipped": skipped,
            "ok": False,
            "reason": (
                "Holdout window had no trainable steps "
                f"(need > {n_lags} history points before each holdout day)."
            ),
        }

    mae = mean_absolute_error(actuals, predictions)
    mape = mean_absolute_percentage_error(actuals, predictions)
    return {
        "holdoutDays": holdout_days,
        "pointsEvaluated": len(actuals),
        "mae": None if mae is None else round(mae, 4),
        "mape": None if mape is None else round(mape, 2),
        "method": f"sklearn_lag_{model_name}",
        "skipped": skipped,
        "ok": True,
        "reason": None,
    }


def run_sklearn_for_product(
    series_frame,
    *,
    horizon_days: int = DEFAULT_HORIZON_DAYS,
    n_lags: int = DEFAULT_N_LAGS,
    include_rolling_mean: bool = True,
    model_name: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    history = history_points_from_series(series_frame)
    forecast = sklearn_lag_forecast(
        history,
        horizon_days=horizon_days,
        n_lags=n_lags,
        include_rolling_mean=include_rolling_mean,
        model_name=model_name,
    )
    holdout = evaluate_sklearn_lag_holdout(
        history,
        horizon_days=horizon_days,
        n_lags=n_lags,
        include_rolling_mean=include_rolling_mean,
        model_name=model_name,
    )
    return {
        "points": len(history),
        "forecast": forecast,
        "holdout": holdout,
    }


def main() -> int:
    default_data = Path(__file__).resolve().parent / "data" / "demo_daily_demand.json"
    parser = argparse.ArgumentParser(
        description="Fit a sklearn lag-feature demand forecast and report holdout errors."
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=default_data,
        help="Demand JSON/CSV path (default: data/demo_daily_demand.json)",
    )
    parser.add_argument("--product-id", default=None, help="Optional productId filter")
    parser.add_argument(
        "--horizon-days",
        type=int,
        default=DEFAULT_HORIZON_DAYS,
        choices=FORECAST_HORIZONS,
        help="Forecast horizon in days (7, 14, or 30)",
    )
    parser.add_argument(
        "--n-lags",
        type=int,
        default=DEFAULT_N_LAGS,
        help="Number of lag days used as features (default: 7)",
    )
    parser.add_argument(
        "--model",
        choices=("ridge", "random_forest"),
        default=DEFAULT_MODEL,
        help="Regressor type (default: ridge)",
    )
    parser.add_argument(
        "--no-rolling-mean",
        action="store_true",
        help="Disable the rolling-mean feature over the lag window",
    )
    args = parser.parse_args()

    include_rolling_mean = not args.no_rolling_mean
    series = load_daily_demand(args.input, product_id=args.product_id)
    product_ids = list(series["productId"].drop_duplicates())

    print(
        f"Sklearn lag forecast on {args.input}  "
        f"model={args.model}  nLags={args.n_lags}  horizonDays={args.horizon_days}"
    )

    for product_id in product_ids:
        product_series = series[series["productId"] == product_id]
        result = run_sklearn_for_product(
            product_series,
            horizon_days=args.horizon_days,
            n_lags=args.n_lags,
            include_rolling_mean=include_rolling_mean,
            model_name=args.model,
        )
        forecast = result["forecast"]
        holdout = result["holdout"]

        print(f"\nproductId={product_id}  historyDays={result['points']}")
        if not forecast["ok"]:
            print(f"  forecast skipped: {forecast['reason']}")
        else:
            print(
                f"  forecast: avgDaily={forecast['averageDailyDemand']}  "
                f"predicted={forecast['predictedDemand']}  "
                f"trainRows={forecast['trainRows']}"
            )

        if holdout is None:
            print(
                f"  holdout unavailable (need >= {EVAL_MIN_HISTORY_POINTS} daily points)"
            )
        elif not holdout.get("ok", True):
            print(f"  holdout skipped: {holdout.get('reason')}")
        else:
            print(
                f"  holdout: days={holdout['holdoutDays']}  "
                f"points={holdout['pointsEvaluated']}  "
                f"mae={holdout['mae']}  mape={holdout['mape']}"
            )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
