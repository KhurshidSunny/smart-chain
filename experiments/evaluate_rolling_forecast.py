"""Rolling-origin forecast evaluation on daily demand.

Each origin trains only on rows strictly before that origin. Validation
origins sit immediately before the test origins. Method choice uses
validation MAE only. Ridge features are not scaled; multi-step Ridge
appends its own predictions, not later actuals.

Metrics are MAE, WAPE, and sMAPE. MAPE is also stored. MAPE skips zero
actuals, so it is not comparable to the other three on intermittent series.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import time
from pathlib import Path

from report_reproducibility import sha256_file

for _thread_key in (
    "OMP_NUM_THREADS",
    "OPENBLAS_NUM_THREADS",
    "MKL_NUM_THREADS",
    "NUMEXPR_NUM_THREADS",
):
    os.environ.setdefault(_thread_key, "1")

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

from classical_forecast import (
    croston_forecast,
    exponential_smoothing_forecast,
    moving_average_forecast,
    zero_day_ratio,
)
from load_demand_history import load_daily_demand
from sklearn_lag_forecast import MIN_TRAIN_ROWS, build_lag_feature_matrix

EXPERIMENTS_DIR = Path(__file__).resolve().parent
CONFIG_PATH = EXPERIMENTS_DIR / "rolling_forecast_config.json"
FIXTURE_PATH = (
    EXPERIMENTS_DIR / "data" / "fixtures" / "rolling_forecast_sample" / "daily_demand.csv"
)
DEFAULT_INPUT = EXPERIMENTS_DIR / "data" / "uci_processed" / "daily_demand.csv"

METHODS = (
    "seasonal_naive",
    "moving_average",
    "exponential_smoothing",
    "croston",
    "ridge_lag",
)

METRIC_DECIMALS = 6


def load_config(path: Path = CONFIG_PATH) -> dict:
    config = json.loads(path.read_text(encoding="utf-8"))
    validate_config(config)
    return config


def validate_config(config: dict) -> None:
    required = (
        "season_length",
        "horizon_days",
        "origin_step_days",
        "min_train_days",
        "validation_origins",
        "test_origins",
        "moving_average_window",
        "smoothing_alpha",
        "ridge_alpha",
        "n_lags",
        "include_rolling_mean",
        "intermittent_zero_ratio",
        "min_positive_days",
        "min_span_days",
        "min_total_quantity",
    )
    missing = [key for key in required if key not in config]
    if missing:
        raise ValueError(f"Forecast config is missing {missing}.")
    if int(config["origin_step_days"]) < int(config["horizon_days"]):
        raise ValueError(
            "origin_step_days must be at least horizon_days so scored days are not repeated."
        )
    if int(config["season_length"]) < 1:
        raise ValueError("season_length must be >= 1.")
    if int(config["season_length"]) > int(config["min_train_days"]):
        raise ValueError("min_train_days must cover one season.")
    if int(config["validation_origins"]) < 1 or int(config["test_origins"]) < 1:
        raise ValueError("validation_origins and test_origins must be >= 1.")
    if int(config["n_lags"]) < 1 or int(config["moving_average_window"]) < 1:
        raise ValueError("n_lags and moving_average_window must be >= 1.")
    alpha = float(config["smoothing_alpha"])
    if not 0 < alpha <= 1:
        raise ValueError("smoothing_alpha must be in (0, 1].")
    if float(config["ridge_alpha"]) <= 0:
        raise ValueError("ridge_alpha must be > 0.")
    ratio = float(config["intermittent_zero_ratio"])
    if not 0 <= ratio <= 1:
        raise ValueError("intermittent_zero_ratio must be in [0, 1].")


def minimum_length(config: dict) -> int:
    origins = int(config["validation_origins"]) + int(config["test_origins"])
    return (
        int(config["min_train_days"])
        + (origins - 1) * int(config["origin_step_days"])
        + int(config["horizon_days"])
    )


def list_origins(n_days: int, config: dict) -> dict[str, list[int]]:
    """Latest rolling origins, split into validation then test."""
    horizon = int(config["horizon_days"])
    step = int(config["origin_step_days"])
    min_train = int(config["min_train_days"])
    n_validation = int(config["validation_origins"])
    n_test = int(config["test_origins"])
    last = n_days - horizon
    empty = {"validation": [], "test": []}
    if last < min_train:
        return empty

    origins = list(range(last, min_train - 1, -step))
    origins.reverse()
    need = n_validation + n_test
    if len(origins) < need:
        return empty
    chosen = origins[-need:]
    return {
        "validation": chosen[:n_validation],
        "test": chosen[n_validation:],
    }


def _flat_daily(history: list[float], method: str, config: dict) -> float:
    kwargs = {
        "horizon_days": int(config["horizon_days"]),
        "window": int(config["moving_average_window"]),
        "alpha": float(config["smoothing_alpha"]),
    }
    if method == "moving_average":
        return float(moving_average_forecast(history, **kwargs)["averageDailyDemand"])
    if method == "exponential_smoothing":
        return float(exponential_smoothing_forecast(history, **kwargs)["averageDailyDemand"])
    if method == "croston":
        return float(croston_forecast(history, **kwargs)["averageDailyDemand"])
    raise ValueError(f"Unknown flat method {method}.")


def _seasonal_naive_path(history: list[float], config: dict) -> list[float]:
    season = int(config["season_length"])
    horizon = int(config["horizon_days"])
    extended = list(history)
    path = []
    for _ in range(horizon):
        value = float(extended[-season])
        path.append(value)
        extended.append(value)
    return path


def _ridge_path(history: list[float], config: dict) -> list[float]:
    """Fit on history only, then roll predictions forward one day at a time."""
    horizon = int(config["horizon_days"])
    n_lags = int(config["n_lags"])
    include_rolling_mean = bool(config["include_rolling_mean"])
    built = build_lag_feature_matrix(
        history,
        n_lags=n_lags,
        include_rolling_mean=include_rolling_mean,
    )
    if built is None or len(built[1]) < MIN_TRAIN_ROWS:
        fallback = sum(history) / len(history) if history else 0.0
        return [round(max(0.0, fallback), METRIC_DECIMALS)] * horizon

    features, targets = built
    model = Ridge(alpha=float(config["ridge_alpha"]))
    model.fit(features, targets)

    extended = list(history)
    path = []
    for _ in range(horizon):
        lags = [extended[-lag] for lag in range(1, n_lags + 1)]
        row = list(lags)
        if include_rolling_mean:
            row.append(sum(lags) / len(lags))
        predicted = float(model.predict(np.asarray(row, dtype=float).reshape(1, -1))[0])
        predicted = round(max(0.0, predicted), METRIC_DECIMALS)
        path.append(predicted)
        extended.append(predicted)
    return path


def forecast_at_origin(
    quantities: list[float],
    origin: int,
    method: str,
    config: dict,
) -> list[float]:
    """Forecast horizon days starting at origin. History is quantities[:origin]."""
    if method not in METHODS:
        raise ValueError(f"Unknown method {method}.")
    horizon = int(config["horizon_days"])
    if origin < int(config["min_train_days"]) or origin + horizon > len(quantities):
        raise ValueError(
            f"Origin {origin} is outside the series of length {len(quantities)}."
        )
    history = [float(value) for value in quantities[:origin]]
    if method == "seasonal_naive":
        return _seasonal_naive_path(history, config)
    if method == "ridge_lag":
        return _ridge_path(history, config)
    level = _flat_daily(history, method, config)
    return [level] * horizon


def _round_metric(value: float | None) -> float | None:
    if value is None:
        return None
    return round(float(value), METRIC_DECIMALS)


def score_points(actuals: list[float], predictions: list[float]) -> dict:
    if len(actuals) != len(predictions) or not actuals:
        raise ValueError("Actuals and predictions must be the same non-empty length.")
    absolute_errors = [abs(actual - predicted) for actual, predicted in zip(actuals, predictions)]
    mae = sum(absolute_errors) / len(absolute_errors)
    actual_total = sum(actuals)
    wape = None if actual_total == 0 else 100.0 * sum(absolute_errors) / actual_total

    smape_total = 0.0
    mape_total = 0.0
    mape_points = 0
    zero_actuals = 0
    for actual, predicted, error in zip(actuals, predictions, absolute_errors):
        if actual == 0:
            zero_actuals += 1
        else:
            mape_total += error / abs(actual)
            mape_points += 1
        denominator = abs(actual) + abs(predicted)
        smape_total += 0.0 if denominator == 0 else (2.0 * error / denominator)

    return {
        "points": len(actuals),
        "zero_actual_points": zero_actuals,
        "mae": _round_metric(mae),
        "wape": _round_metric(wape),
        "smape": _round_metric(100.0 * smape_total / len(actuals)),
        "mape": None if mape_points == 0 else _round_metric(100.0 * mape_total / mape_points),
    }


def select_method(validation_scores: dict[str, dict]) -> str:
    """Lowest validation MAE. Ties keep the earlier entry in METHODS."""

    def sort_key(method: str) -> tuple[float, int]:
        return (float(validation_scores[method]["mae"]), METHODS.index(method))

    return min(METHODS, key=sort_key)


def _is_daily(dates: pd.Series) -> bool:
    parsed = pd.to_datetime(dates, format="%Y-%m-%d")
    if len(parsed) <= 1:
        return True
    gaps = parsed.diff().dt.days.iloc[1:]
    return bool((gaps == 1).all())


class _Pool:
    def __init__(self) -> None:
        self.points = 0
        self.zero_actual_points = 0
        self.absolute_error = 0.0
        self.actual_total = 0.0
        self.smape_total = 0.0
        self.mape_total = 0.0
        self.mape_points = 0
        self.series_scores: list[dict] = []

    def add_series(self, actuals: list[float], predictions: list[float]) -> dict:
        score = score_points(actuals, predictions)
        self.series_scores.append(score)
        self.points += score["points"]
        self.zero_actual_points += score["zero_actual_points"]
        for actual, predicted in zip(actuals, predictions):
            error = abs(actual - predicted)
            self.absolute_error += error
            self.actual_total += actual
            if actual != 0:
                self.mape_total += error / abs(actual)
                self.mape_points += 1
            denominator = abs(actual) + abs(predicted)
            if denominator != 0:
                self.smape_total += 2.0 * error / denominator
        return score

    def metrics(self) -> dict:
        if self.points == 0:
            micro_mae = None
            micro_wape = None
            micro_smape = None
            micro_mape = None
        else:
            micro_mae = self.absolute_error / self.points
            micro_wape = (
                None if self.actual_total == 0 else 100.0 * self.absolute_error / self.actual_total
            )
            micro_smape = 100.0 * self.smape_total / self.points
            micro_mape = None if self.mape_points == 0 else 100.0 * self.mape_total / self.mape_points
        return {
            "series_count": len(self.series_scores),
            "points": self.points,
            "zero_actual_points": self.zero_actual_points,
            "mape_series": sum(1 for score in self.series_scores if score["mape"] is not None),
            "macro_mae": _mean_key(self.series_scores, "mae"),
            "macro_wape": _mean_key(self.series_scores, "wape"),
            "macro_smape": _mean_key(self.series_scores, "smape"),
            "macro_mape": _mean_key(self.series_scores, "mape"),
            "micro_mae": _round_metric(micro_mae),
            "micro_wape": _round_metric(micro_wape),
            "micro_smape": _round_metric(micro_smape),
            "micro_mape": _round_metric(micro_mape),
            "series_mae_std": _sample_std([score["mae"] for score in self.series_scores if score["mae"] is not None]),
        }


def _sample_std(values: list[float]) -> float | None:
    if len(values) < 2:
        return None
    mean = sum(values) / len(values)
    variance = sum((value - mean) ** 2 for value in values) / (len(values) - 1)
    return _round_metric(math.sqrt(variance))


class _FoldStats:
    """Micro MAE at each protocol fold. Fold 0 is the earliest kept origin."""

    def __init__(self, n_folds: int) -> None:
        self.absolute_error = [0.0] * n_folds
        self.points = [0] * n_folds

    def add(self, fold_index: int, actuals: list[float], predictions: list[float]) -> None:
        self.points[fold_index] += len(actuals)
        self.absolute_error[fold_index] += sum(
            abs(actual - predicted) for actual, predicted in zip(actuals, predictions)
        )

    def as_dict(self) -> dict:
        fold_mae = [
            None if count == 0 else _round_metric(error / count)
            for error, count in zip(self.absolute_error, self.points)
        ]
        present = [value for value in fold_mae if value is not None]
        mean = None if not present else _round_metric(sum(present) / len(present))
        return {
            "fold_micro_mae": fold_mae,
            "fold_micro_mae_mean": mean,
            "fold_micro_mae_std": _sample_std(present),
        }


def _mean_key(scores: list[dict], key: str) -> float | None:
    values = [score[key] for score in scores if score[key] is not None]
    if not values:
        return None
    return _round_metric(sum(values) / len(values))


def _demand_class(prefix: list[float], config: dict) -> str:
    if zero_day_ratio(prefix) >= float(config["intermittent_zero_ratio"]):
        return "intermittent"
    return "dense"


def _exclusion_reason(
    quantities: list[float],
    dates: pd.Series,
    config: dict,
) -> str | None:
    if not _is_daily(dates):
        return "excluded_non_daily"
    span_days = (pd.to_datetime(dates.iloc[-1]) - pd.to_datetime(dates.iloc[0])).days + 1
    if len(quantities) < minimum_length(config) or span_days < int(config["min_span_days"]):
        return "excluded_too_short"
    positive_days = sum(1 for value in quantities if value > 0)
    if positive_days < int(config["min_positive_days"]):
        return "excluded_too_few_positive_days"
    if sum(quantities) < float(config["min_total_quantity"]):
        return "excluded_low_total_quantity"
    origins = list_origins(len(quantities), config)
    if not origins["validation"] or not origins["test"]:
        return "excluded_too_few_origins"
    return None


def evaluate_frame(frame: pd.DataFrame, config: dict | None = None) -> dict:
    config = load_config() if config is None else config
    validate_config(config)
    working = frame.loc[:, ["productId", "date", "quantity"]].copy()
    working["productId"] = working["productId"].astype(str)
    working["quantity"] = working["quantity"].astype(float)
    working = (
        working.groupby(["productId", "date"], as_index=False)["quantity"]
        .sum()
        .sort_values(["productId", "date"], kind="mergesort")
        .reset_index(drop=True)
    )

    counts = {
        "series_seen": 0,
        "included": 0,
        "excluded_non_daily": 0,
        "excluded_too_short": 0,
        "excluded_too_few_positive_days": 0,
        "excluded_low_total_quantity": 0,
        "excluded_too_few_origins": 0,
    }
    series_reports = []
    pools = {
        group: {split: {method: _Pool() for method in METHODS} for split in ("validation", "test")}
        for group in ("all", "dense", "intermittent")
    }
    fold_counts = {
        "validation": int(config["validation_origins"]),
        "test": int(config["test_origins"]),
    }
    fold_stats = {
        group: {
            split: {method: _FoldStats(fold_counts[split]) for method in METHODS}
            for split in ("validation", "test")
        }
        for group in ("all", "dense", "intermittent")
    }
    selection_counts = {
        group: {method: 0 for method in METHODS} for group in ("all", "dense", "intermittent")
    }

    for product_id, group in working.groupby("productId", sort=True):
        counts["series_seen"] += 1
        group = group.sort_values("date", kind="mergesort")
        quantities = [float(value) for value in group["quantity"].tolist()]
        dates = group["date"].astype(str).reset_index(drop=True)
        reason = _exclusion_reason(quantities, dates, config)
        if reason is not None:
            counts[reason] += 1
            continue

        origins = list_origins(len(quantities), config)
        prefix = quantities[: origins["validation"][0]]
        demand_class = _demand_class(prefix, config)
        split_scores = {}
        horizon = int(config["horizon_days"])
        for split in ("validation", "test"):
            scores = {}
            for method in METHODS:
                actuals: list[float] = []
                predictions: list[float] = []
                for fold_index, origin in enumerate(origins[split]):
                    origin_actuals = [float(value) for value in quantities[origin : origin + horizon]]
                    origin_predictions = forecast_at_origin(quantities, origin, method, config)
                    actuals.extend(origin_actuals)
                    predictions.extend(origin_predictions)
                    for group_name in ("all", demand_class):
                        fold_stats[group_name][split][method].add(
                            fold_index, origin_actuals, origin_predictions
                        )
                scores[method] = score_points(actuals, predictions)
                for group_name in ("all", demand_class):
                    pools[group_name][split][method].add_series(actuals, predictions)
            split_scores[split] = scores

        selected = select_method(split_scores["validation"])
        selection_counts["all"][selected] += 1
        selection_counts[demand_class][selected] += 1

        counts["included"] += 1
        series_reports.append(
            {
                "productId": str(product_id),
                "n_days": len(quantities),
                "demand_class": demand_class,
                "classification_zero_ratio": _round_metric(zero_day_ratio(prefix)),
                "classification_days": len(prefix),
                "validation_origin_dates": [dates.iloc[origin] for origin in origins["validation"]],
                "test_origin_dates": [dates.iloc[origin] for origin in origins["test"]],
                "validation_selected_method": selected,
                "validation": split_scores["validation"],
                "test": split_scores["test"],
            }
        )

    summary = {}
    for group_name, splits in pools.items():
        summary[group_name] = {
            "series_count": splits["test"][METHODS[0]].metrics()["series_count"],
            "validation": {
                method: {**pool.metrics(), **fold_stats[group_name]["validation"][method].as_dict()}
                for method, pool in splits["validation"].items()
            },
            "test": {
                method: {**pool.metrics(), **fold_stats[group_name]["test"][method].as_dict()}
                for method, pool in splits["test"].items()
            },
        }
    summary["validation_selected_method_counts"] = selection_counts

    return {
        "config": config,
        "protocol": _protocol(),
        "inclusion": counts,
        "series": series_reports,
        "summary": summary,
    }


def _protocol() -> dict:
    return {
        "split": "rolling_origin",
        "alignment": "The latest origins are kept. The validation block is immediately before the test block.",
        "history": "Each origin uses only demand strictly before the origin date.",
        "seasonal_naive": "The forecast repeats the previous season, walking forward with its own predictions when the horizon is longer than one season.",
        "ridge": "Ridge is fit on lag rows inside the history. Later horizon days use predicted values.",
        "scaling": "Ridge features are not scaled.",
        "model_selection": "The selected method is the lowest validation MAE. Ties keep the earlier method in the method list. Test rows are not used.",
        "demand_class": "Dense or intermittent is decided from the zero-day ratio before the first validation origin.",
        "macro": "Unweighted mean of per-series scores.",
        "micro": "One score on the pooled points of every series in the group.",
        "folds": "Fold 1 is the earliest origin in the kept block and the last fold is the latest. A fold score pools every series at that protocol position. Calendar dates are not aligned across series.",
        "series_mae_std": "Sample standard deviation of per-series MAE inside the group.",
        "mape_caveat": "MAPE skips zero actuals. It is not comparable to MAE, WAPE, or sMAPE when many days have zero demand.",
        "methods": list(METHODS),
    }


def dump_report(report: dict) -> str:
    return json.dumps(report, indent=2, sort_keys=True, allow_nan=False) + "\n"


def public_summary(report: dict, source: Path) -> dict:
    """Drop per-series rows. Keep the aggregates the write-up is rendered from."""
    preparation = None
    quality_path = source.parent / "quality_report.json"
    if quality_path.is_file():
        quality = json.loads(quality_path.read_text(encoding="utf-8"))
        preparation = {
            "row_counts": quality.get("row_counts"),
            "workbook_sha256": (quality.get("source") or {}).get("workbook_sha256"),
        }
    return {
        "config": report["config"],
        "protocol": report["protocol"],
        "inclusion": report["inclusion"],
        "summary": report["summary"],
        "runtime_seconds": report.get("runtime_seconds"),
        "input_name": report.get("input_name") or source.name,
        "input_sha256": sha256_file(source),
        "preparation": preparation,
    }


def evaluate_path(path: Path, config: dict | None = None) -> dict:
    frame = load_daily_demand(path)
    return evaluate_frame(frame, config)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        type=Path,
        help="Daily demand CSV or JSON. Defaults to data/uci_processed/daily_demand.csv.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Full machine-readable results JSON, including per-series rows.",
    )
    parser.add_argument(
        "--summary-output",
        type=Path,
        help="Aggregate JSON used to render the retail results document.",
    )
    parser.add_argument(
        "--fixture",
        action="store_true",
        help="Evaluate the committed sample instead of the full demand file.",
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=CONFIG_PATH,
        help="Fixed evaluation config. Defaults to rolling_forecast_config.json.",
    )
    args = parser.parse_args()
    config = load_config(args.config)

    if args.fixture:
        source = FIXTURE_PATH
    else:
        source = args.input or DEFAULT_INPUT
    if not source.is_file():
        raise SystemExit(
            f"Demand file not found: {source}. Pass --input, or run ingest_uci_retail.py first."
        )

    started = time.perf_counter()
    report = evaluate_path(source, config)
    report["runtime_seconds"] = round(time.perf_counter() - started, 3)
    report["input_name"] = source.name

    included = report["inclusion"]["included"]
    print(
        f"Evaluated {included} series "
        f"({report['summary']['dense']['series_count']} dense, "
        f"{report['summary']['intermittent']['series_count']} intermittent) "
        f"in {report['runtime_seconds']}s"
    )
    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(dump_report(report), encoding="utf-8")
        print(f"Wrote {args.output}")
    if args.summary_output is not None:
        args.summary_output.parent.mkdir(parents=True, exist_ok=True)
        args.summary_output.write_text(dump_report(public_summary(report, source)), encoding="utf-8")
        print(f"Wrote {args.summary_output}")


if __name__ == "__main__":
    main()
