"""Render the public retail forecast write-up from the aggregate summary JSON.

The summary is produced by evaluate_rolling_forecast.py --summary-output.
generate_reports.py rebuilds this markdown from that file. It does not
re-score the retail workbook.
"""

from __future__ import annotations

import json
from pathlib import Path

from evaluate_rolling_forecast import METHODS
from report_reproducibility import REPO_ROOT, sha256_file

SUMMARY_PATH = REPO_ROOT / "docs" / "samples" / "retail_rolling_forecast_summary.json"
REPORT_PATH = REPO_ROOT / "docs" / "retail-forecast-evaluation.md"
PROVENANCE_PATH = REPO_ROOT / "experiments" / "retail_provenance.json"

METHOD_LABELS = {
    "seasonal_naive": "Seasonal naive",
    "moving_average": "Moving average",
    "exponential_smoothing": "Exponential smoothing",
    "croston": "Croston",
    "ridge_lag": "Ridge lag",
}
GROUP_ORDER = ("all", "dense", "intermittent")
GROUP_LABELS = {
    "all": "All scored series",
    "dense": "Dense series",
    "intermittent": "Intermittent series",
}
GROUP_NOUNS = {
    "all": "series",
    "dense": "dense series",
    "intermittent": "intermittent series",
}


def _fmt(value: object) -> str:
    if value is None:
        return "—"
    return f"{float(value):.4f}"


def _lowest(block: dict, key: str) -> str:
    return min(METHODS, key=lambda method: (float(block[method][key]), METHODS.index(method)))


def _highest(block: dict, key: str) -> str:
    return max(METHODS, key=lambda method: (float(block[method][key]), METHODS.index(method)))


def _most_selected(counts: dict[str, int]) -> list[str]:
    best = max(int(counts[method]) for method in METHODS)
    return [method for method in METHODS if int(counts[method]) == best]


def render_retail_report(
    summary: dict | None = None,
    summary_path: Path | None = None,
) -> str:
    if summary is None:
        summary_path = SUMMARY_PATH
        summary = json.loads(summary_path.read_text(encoding="utf-8"))
    provenance = json.loads(PROVENANCE_PATH.read_text(encoding="utf-8"))
    lines = [
        "# Public retail forecast evaluation",
        "",
        "Offline rolling-origin scores on daily demand built from UCI Online Retail II.",
        "This file is separate from the synthetic demo holdouts in",
        "`forecast-comparison-results.md`. It is not the live Analytics forecast.",
        "",
        "## Preparation",
        "",
        f"- Dataset: {provenance['citation']}",
        f"- License: {provenance['license']}. DOI: https://doi.org/{provenance['doi']}",
        f"- Related paper: {provenance['related_paper']}",
        "- Transactions are cleaned by `experiments/ingest_uci_retail.py` "
        "(duplicates, blank stock codes, bad dates, cancellations, returns, "
        "invalid prices, and invalid quantities). Missing customer ids are counted and kept.",
        "- A scored series is a continuous daily calendar that passes the thresholds in the config below.",
    ]
    preparation = summary.get("preparation") or {}
    row_counts = preparation.get("row_counts") or {}
    if row_counts:
        lines.extend(
            [
                f"- Transactions read: **{int(row_counts['rows_read'])}**.",
                f"- Duplicate rows removed: **{int(row_counts['duplicate_rows_removed'])}**.",
                f"- Cancellations removed: **{int(row_counts['cancellations'])}**.",
                f"- Returns removed: **{int(row_counts['returns'])}**.",
                f"- Invalid prices removed: **{int(row_counts['invalid_price'])}**.",
                f"- Rows kept for demand: **{int(row_counts['rows_kept_for_demand'])}**.",
                f"- Kept rows with a missing customer id: **{int(row_counts['missing_customer_id_kept'])}**.",
            ]
        )
    inclusion = summary["inclusion"]
    lines.extend(
        [
            f"- Series in the demand file: **{int(inclusion['series_seen'])}**.",
            f"- Series scored: **{int(inclusion['included'])}**.",
            f"- Excluded as too short: **{int(inclusion['excluded_too_short'])}**.",
            f"- Excluded as non-daily: **{int(inclusion['excluded_non_daily'])}**.",
            f"- Excluded for too few positive days: **{int(inclusion['excluded_too_few_positive_days'])}**.",
            f"- Excluded for low total quantity: **{int(inclusion['excluded_low_total_quantity'])}**.",
            "",
            "## Split and metrics",
            "",
        ]
    )
    config = summary["config"]
    protocol = summary["protocol"]
    lines.extend(
        [
            f"- Season length: **{int(config['season_length'])}** days.",
            f"- Horizon: **{int(config['horizon_days'])}** days. Origin step: **{int(config['origin_step_days'])}** days.",
            f"- Minimum training length: **{int(config['min_train_days'])}** days.",
            f"- Validation origins: **{int(config['validation_origins'])}**. Test origins: **{int(config['test_origins'])}**.",
            f"- Moving-average window: **{int(config['moving_average_window'])}**. "
            f"Smoothing alpha: **{config['smoothing_alpha']}**. Ridge alpha: **{config['ridge_alpha']}**. "
            f"Lags: **{int(config['n_lags'])}**.",
            f"- Intermittent when the pre-validation zero-day ratio is at least **{config['intermittent_zero_ratio']}**.",
            f"- {protocol['alignment']}",
            f"- {protocol['history']}",
            f"- {protocol['seasonal_naive']}",
            f"- {protocol['ridge']} {protocol['scaling']}",
            f"- {protocol['model_selection']}",
            f"- {protocol['demand_class']}",
            f"- {protocol['folds']}",
            f"- Macro: {protocol['macro']} Micro: {protocol['micro']}",
            f"- {protocol['mape_caveat']}",
            f"- {protocol['series_mae_std']}",
            "",
            "The tables below use the **test** block. Validation is used only to count which method each series would have selected.",
            "",
            "## Test results",
            "",
        ]
    )
    if _micro_matches_macro(summary):
        lines.append(
            "Micro MAE matches macro MAE here because every scored series has the same number of test points."
        )
        lines.append("")
    for group in GROUP_ORDER:
        block = summary["summary"][group]
        lines.append(f"### {GROUP_LABELS[group]}")
        lines.append("")
        lines.append(f"Series: **{int(block['series_count'])}**.")
        lines.append("")
        lines.extend(_metric_table(block["test"]))
        lines.append("")

    lines.extend(["## Variability across test folds", ""])
    lines.append(
        "Each column is test micro MAE at that protocol fold. "
        "Fold 1 is the earliest test origin in the kept block."
    )
    lines.append("")
    for group in GROUP_ORDER:
        lines.append(f"### {GROUP_LABELS[group]}")
        lines.append("")
        lines.extend(_fold_table(summary["summary"][group]["test"]))
        lines.append("")

    lines.extend(["## Where the methods land", ""])
    lines.extend(_interpretation(summary))
    lines.extend(["", "## Limits", ""])
    lines.extend(
        [
            "- Hyperparameters are fixed in `experiments/rolling_forecast_config.json`. They are not tuned on the test block.",
            "- The weekly season is an assumption. A series with a different cycle is not given a different season length.",
            "- Dense and intermittent labels use only the history before the first validation origin.",
            "- MAPE skips zero actuals, so it answers a different question from MAE, WAPE, and sMAPE on intermittent series.",
            "- The live Analytics service still uses its own short holdout and method switch. This document does not replace that path.",
            "- Synthetic demo rankings stay in `forecast-comparison-results.md` and are not mixed into these tables.",
            f"- Runtime of the scoring run that wrote this summary: **{summary['runtime_seconds']}** seconds on that machine. "
            "`python generate_reports.py --check` rebuilds this markdown from the summary and does not re-score the workbook.",
            "",
            "## Reproduce",
            "",
            "```powershell",
            "cd experiments",
            "python ingest_uci_retail.py --download",
            "python evaluate_rolling_forecast.py --input data/uci_processed/daily_demand.csv --summary-output ../docs/samples/retail_rolling_forecast_summary.json",
            "python generate_reports.py",
            "python generate_reports.py --check",
            "```",
            "",
            f"- Demand file: `{summary.get('input_name')}` SHA-256 `{summary.get('input_sha256')}`",
        ]
    )
    workbook_sha = preparation.get("workbook_sha256")
    if workbook_sha:
        lines.append(f"- Workbook SHA-256 recorded by ingestion: `{workbook_sha}`")
    if summary_path is not None and summary_path.is_file():
        digest = sha256_file(summary_path)
        lines.append(f"- Summary JSON: `docs/samples/retail_rolling_forecast_summary.json` SHA-256 `{digest}`")
    lines.append("")
    return "\n".join(lines)


def _metric_table(methods: dict) -> list[str]:
    header = (
        "| Method | Micro MAE | Macro MAE | Micro WAPE | Micro sMAPE | Micro MAPE | Series MAE SD |"
    )
    align = "|---|---:|---:|---:|---:|---:|---:|"
    rows = [header, align]
    for method in METHODS:
        score = methods[method]
        rows.append(
            "| {label} | {micro_mae} | {macro_mae} | {micro_wape} | {micro_smape} | {micro_mape} | {series_sd} |".format(
                label=METHOD_LABELS[method],
                micro_mae=_fmt(score["micro_mae"]),
                macro_mae=_fmt(score["macro_mae"]),
                micro_wape=_fmt(score["micro_wape"]),
                micro_smape=_fmt(score["micro_smape"]),
                micro_mape=_fmt(score["micro_mape"]),
                series_sd=_fmt(score["series_mae_std"]),
            )
        )
    return rows


def _fold_table(methods: dict) -> list[str]:
    n_folds = len(methods[METHODS[0]]["fold_micro_mae"])
    labels = " | ".join(METHOD_LABELS[method] for method in METHODS)
    rows = [
        f"| Fold | {labels} |",
        "|" + "---|" * (len(METHODS) + 1),
    ]
    for index in range(n_folds):
        note = ""
        if index == 0:
            note = " (earliest)"
        elif index == n_folds - 1:
            note = " (latest)"
        values = " | ".join(_fmt(methods[method]["fold_micro_mae"][index]) for method in METHODS)
        rows.append(f"| {index + 1}{note} | {values} |")
    std_values = " | ".join(_fmt(methods[method]["fold_micro_mae_std"]) for method in METHODS)
    rows.append(f"| Sample SD | {std_values} |")
    return rows


def _micro_matches_macro(summary: dict) -> bool:
    for group in GROUP_ORDER:
        block = summary["summary"][group]
        if int(block["series_count"]) == 0:
            continue
        for method in METHODS:
            score = block["test"][method]
            if score["micro_mae"] != score["macro_mae"]:
                return False
    return True


def _interpretation(summary: dict) -> list[str]:
    lines = []
    if any(
        summary["summary"][group]["test"][method]["micro_wape"] is not None
        and float(summary["summary"][group]["test"][method]["micro_wape"]) > 100
        for group in GROUP_ORDER
        for method in METHODS
        if int(summary["summary"][group]["series_count"]) > 0
    ):
        lines.append(
            "- A micro WAPE above 100 means the summed absolute error is larger than the summed demand."
        )
    counts_by_group = summary["summary"]["validation_selected_method_counts"]
    for group in GROUP_ORDER:
        block = summary["summary"][group]
        if int(block["series_count"]) == 0:
            lines.append(f"- {GROUP_LABELS[group]}: no series were scored.")
            continue
        test = block["test"]
        mae_method = _lowest(test, "micro_mae")
        wape_method = _lowest(test, "micro_wape")
        smape_method = _lowest(test, "micro_smape")
        mape_method = _lowest(test, "micro_mape")
        worst = _highest(test, "micro_mae")
        lines.append(
            f"- {GROUP_LABELS[group]}: lowest test micro MAE was **{METHOD_LABELS[mae_method]}** "
            f"({_fmt(test[mae_method]['micro_mae'])}). "
            f"Highest test micro MAE was **{METHOD_LABELS[worst]}** "
            f"({_fmt(test[worst]['micro_mae'])})."
        )
        if wape_method != mae_method:
            lines.append(
                f"- {GROUP_LABELS[group]}: lowest test micro WAPE was **{METHOD_LABELS[wape_method]}** "
                f"({_fmt(test[wape_method]['micro_wape'])}), not the MAE leader."
            )
        if smape_method != mae_method:
            lines.append(
                f"- {GROUP_LABELS[group]}: lowest test micro sMAPE was **{METHOD_LABELS[smape_method]}** "
                f"({_fmt(test[smape_method]['micro_smape'])}), not the MAE leader."
            )
        if mape_method != mae_method:
            lines.append(
                f"- {GROUP_LABELS[group]}: lowest test micro MAPE was **{METHOD_LABELS[mape_method]}** "
                f"({_fmt(test[mape_method]['micro_mape'])}). MAPE skips zero actuals, so this ranking is not the MAE ranking."
            )
        selected = _most_selected(counts_by_group[group])
        selected_text = ", ".join(METHOD_LABELS[method] for method in selected)
        selected_count = int(counts_by_group[group][selected[0]])
        lines.append(
            f"- {GROUP_LABELS[group]}: validation MAE selected **{selected_text}** "
            f"for {selected_count} of {int(block['series_count'])} {GROUP_NOUNS[group]}."
        )
        if len(selected) == 1 and selected[0] != mae_method:
            lines.append(
                f"- {GROUP_LABELS[group]}: the method chosen most often on validation "
                f"was not the lowest test micro MAE."
            )
        fold_values = [value for value in test[mae_method]["fold_micro_mae"] if value is not None]
        if fold_values:
            lines.append(
                f"- {GROUP_LABELS[group]}: test-fold micro MAE for **{METHOD_LABELS[mae_method]}** "
                f"ran from {_fmt(min(fold_values))} to {_fmt(max(fold_values))} "
                f"(sample SD {_fmt(test[mae_method]['fold_micro_mae_std'])})."
            )
    return lines
