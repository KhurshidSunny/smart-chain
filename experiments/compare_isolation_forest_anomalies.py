"""Compare Isolation Forest with z-score on the labeled anomaly demo set.

Uses the same leave-one-out protocol per productId as evaluate_zscore_anomalies.py.
Features for Isolation Forest: quantity plus deviation from peer mean.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest

from evaluate_zscore_anomalies import (
    DEFAULT_INPUT,
    DEFAULT_OUTPUT,
    DEFAULT_THRESHOLDS,
    MIN_HISTORY_POINTS,
    choose_best_threshold,
    confusion_counts,
    evaluate_threshold,
    load_anomaly_rows,
    mean,
    precision_recall_f1,
)

DEFAULT_CONTAMINATIONS = (0.1, 0.15, 0.2)
RANDOM_STATE = 42


def _fmt_metric(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.4f}"


def peer_history(
    rows: list[dict[str, Any]],
    index: int,
) -> list[float]:
    product_id = rows[index]["productId"]
    return [
        other["quantity"]
        for j, other in enumerate(rows)
        if j != index and other["productId"] == product_id
    ]


def build_features(quantity: float, history: list[float]) -> list[float]:
    avg = mean(history)
    return [quantity, quantity - avg]


def evaluate_isolation_forest(
    rows: list[dict[str, Any]],
    *,
    contamination: float,
    n_estimators: int = 50,
) -> dict[str, Any]:
    y_true: list[int] = []
    y_pred: list[bool] = []
    skipped = 0

    for index, row in enumerate(rows):
        history = peer_history(rows, index)
        if len(history) < MIN_HISTORY_POINTS:
            skipped += 1
            continue

        # Train on peer quantities only; each training row uses the other peers
        # as its reference mean so features stay leave-one-out consistent.
        train_rows: list[list[float]] = []
        for peer_index, peer_qty in enumerate(history):
            peer_peers = [
                history[k] for k in range(len(history)) if k != peer_index
            ]
            if not peer_peers:
                peer_peers = history
            train_rows.append(build_features(peer_qty, peer_peers))
        train = np.array(train_rows, dtype=float)

        model = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=RANDOM_STATE,
        )
        model.fit(train)
        test = np.array([build_features(row["quantity"], history)], dtype=float)
        pred = model.predict(test)[0]  # -1 anomaly, 1 normal

        y_true.append(row["label"])
        y_pred.append(bool(pred == -1))

    counts = confusion_counts(y_true, y_pred)
    metrics = precision_recall_f1(counts)
    return {
        "method": "Isolation Forest",
        "contamination": contamination,
        "evaluated": len(y_true),
        "skipped": skipped,
        **counts,
        **metrics,
    }


def choose_best_isolation(results: list[dict[str, Any]]) -> dict[str, Any]:
    def sort_key(row: dict[str, Any]) -> tuple[float, float, float]:
        f1 = row["f1"] if row["f1"] is not None else -1.0
        precision = row["precision"] if row["precision"] is not None else -1.0
        # Prefer lower contamination on ties (less aggressive).
        return (f1, precision, -row["contamination"])

    return max(results, key=sort_key)


def parse_floats(raw: str) -> list[float]:
    values = [float(part.strip()) for part in raw.split(",") if part.strip()]
    if not values:
        raise ValueError("Provide at least one numeric value.")
    return values


def render_markdown(
    *,
    input_path: Path,
    z_results: list[dict[str, Any]],
    z_best: dict[str, Any],
    if_results: list[dict[str, Any]],
    if_best: dict[str, Any],
    label_counts: dict[str, int],
) -> str:
    lines = [
        "# Anomaly detection evaluation",
        "",
        "Offline comparison of the Analytics z-score detector and an Isolation Forest",
        "baseline on the same labeled demo set. Labels are injected demo ground truth,",
        "not production fraud labels.",
        "",
        "## Setup",
        "",
        f"- Input: `{Path(input_path).as_posix()}`",
        "- Protocol: leave-one-out history per `productId` (same product peers)",
        f"- Min history points: **{MIN_HISTORY_POINTS}**",
        "- Z-score rule aligned with `microservices/analytics/services/anomalyService.js`",
        "- Isolation Forest features: `[quantity, quantity - peer_mean]`",
        f"- Rows: **{label_counts['total']}** "
        f"(normal={label_counts['normal']}, anomaly={label_counts['anomaly']})",
        "",
        "## Z-score threshold sweep",
        "",
        "| Threshold | Evaluated | TP | FP | TN | FN | Precision | Recall | F1 |",
        "|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]

    for row in z_results:
        lines.append(
            "| {threshold:.1f} | {evaluated} | {tp} | {fp} | {tn} | {fn} | "
            "{precision} | {recall} | {f1} |".format(
                threshold=row["threshold"],
                evaluated=row["evaluated"],
                tp=row["tp"],
                fp=row["fp"],
                tn=row["tn"],
                fn=row["fn"],
                precision=_fmt_metric(row["precision"]),
                recall=_fmt_metric(row["recall"]),
                f1=_fmt_metric(row["f1"]),
            )
        )

    lines.extend(
        [
            "",
            f"Best z-score threshold by F1: **{z_best['threshold']:.1f}** "
            f"(precision={_fmt_metric(z_best['precision'])}, "
            f"recall={_fmt_metric(z_best['recall'])}, "
            f"F1={_fmt_metric(z_best['f1'])})",
            "",
            "## Isolation Forest contamination sweep",
            "",
            "| Contamination | Evaluated | TP | FP | TN | FN | Precision | Recall | F1 |",
            "|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )

    for row in if_results:
        lines.append(
            "| {contamination:.2f} | {evaluated} | {tp} | {fp} | {tn} | {fn} | "
            "{precision} | {recall} | {f1} |".format(
                contamination=row["contamination"],
                evaluated=row["evaluated"],
                tp=row["tp"],
                fp=row["fp"],
                tn=row["tn"],
                fn=row["fn"],
                precision=_fmt_metric(row["precision"]),
                recall=_fmt_metric(row["recall"]),
                f1=_fmt_metric(row["f1"]),
            )
        )

    lines.extend(
        [
            "",
            f"Best Isolation Forest contamination by F1: **{if_best['contamination']:.2f}** "
            f"(precision={_fmt_metric(if_best['precision'])}, "
            f"recall={_fmt_metric(if_best['recall'])}, "
            f"F1={_fmt_metric(if_best['f1'])})",
            "",
            "## Method comparison (best of each)",
            "",
            "| Method | Setting | Precision | Recall | F1 | Notes |",
            "|---|---|---:|---:|---:|---|",
            "| Z-score | threshold={th:.1f} | {zp} | {zr} | {zf} | Live Analytics default is 2.5 |".format(
                th=z_best["threshold"],
                zp=_fmt_metric(z_best["precision"]),
                zr=_fmt_metric(z_best["recall"]),
                zf=_fmt_metric(z_best["f1"]),
            ),
            "| Isolation Forest | contamination={c:.2f} | {ip} | {ir} | {i_f} | sklearn; quantity + peer deviation |".format(
                c=if_best["contamination"],
                ip=_fmt_metric(if_best["precision"]),
                ir=_fmt_metric(if_best["recall"]),
                i_f=_fmt_metric(if_best["f1"]),
            ),
            "",
            "## Interpretation",
            "",
            "- Compare methods on the same labeled demo rows and leave-one-out protocol.",
            "- Higher F1 is preferred here; precision/recall trade-offs still matter in ops.",
            "- Small synthetic sets can favor one method; do not treat this as a production SLA.",
            "- Near-zero injected outliers may behave differently from extreme high quantities.",
            "",
            "## Limits",
            "",
            "- Demo labels only (`experiments/data/anomaly_labels.json`).",
            "- Injected extremes are for method evaluation, not claims about fraud.",
            "- Isolation Forest is an offline baseline; the live Analytics path still uses z-score.",
            "",
            "## How to regenerate",
            "",
            "```powershell",
            "cd experiments",
            "python evaluate_zscore_anomalies.py --write-md",
            "python compare_isolation_forest_anomalies.py --write-md",
            "```",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compare Isolation Forest with z-score anomaly detection."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument(
        "--thresholds",
        type=str,
        default=",".join(str(value) for value in DEFAULT_THRESHOLDS),
        help="Z-score thresholds to recompute for the comparison table.",
    )
    parser.add_argument(
        "--contaminations",
        type=str,
        default=",".join(str(value) for value in DEFAULT_CONTAMINATIONS),
        help="Isolation Forest contamination values to sweep.",
    )
    parser.add_argument(
        "--write-md",
        action="store_true",
        help=f"Write combined results to {DEFAULT_OUTPUT}",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    rows = load_anomaly_rows(args.input)
    thresholds = parse_floats(args.thresholds)
    contaminations = parse_floats(args.contaminations)

    z_results = [evaluate_threshold(rows, threshold=value) for value in thresholds]
    z_best = choose_best_threshold(z_results)
    if_results = [
        evaluate_isolation_forest(rows, contamination=value)
        for value in contaminations
    ]
    if_best = choose_best_isolation(if_results)

    label_counts = {
        "total": len(rows),
        "normal": sum(1 for row in rows if row["label"] == 0),
        "anomaly": sum(1 for row in rows if row["label"] == 1),
    }

    print(f"Loaded {label_counts['total']} labeled rows from {args.input}")
    print(
        f"normal={label_counts['normal']} anomaly={label_counts['anomaly']} "
        f"thresholds={thresholds} contaminations={contaminations}"
    )
    print()
    print("Z-score")
    print(
        f"{'thr':>5} {'eval':>5} {'tp':>4} {'fp':>4} {'tn':>4} {'fn':>4} "
        f"{'prec':>8} {'rec':>8} {'f1':>8}"
    )
    for row in z_results:
        print(
            f"{row['threshold']:5.1f} {row['evaluated']:5d} {row['tp']:4d} "
            f"{row['fp']:4d} {row['tn']:4d} {row['fn']:4d} "
            f"{_fmt_metric(row['precision']):>8} {_fmt_metric(row['recall']):>8} "
            f"{_fmt_metric(row['f1']):>8}"
        )
    print()
    print("Isolation Forest")
    print(
        f"{'cont':>5} {'eval':>5} {'tp':>4} {'fp':>4} {'tn':>4} {'fn':>4} "
        f"{'prec':>8} {'rec':>8} {'f1':>8}"
    )
    for row in if_results:
        print(
            f"{row['contamination']:5.2f} {row['evaluated']:5d} {row['tp']:4d} "
            f"{row['fp']:4d} {row['tn']:4d} {row['fn']:4d} "
            f"{_fmt_metric(row['precision']):>8} {_fmt_metric(row['recall']):>8} "
            f"{_fmt_metric(row['f1']):>8}"
        )
    print()
    print(
        "Best z-score: "
        f"threshold={z_best['threshold']:.1f} "
        f"F1={_fmt_metric(z_best['f1'])}"
    )
    print(
        "Best Isolation Forest: "
        f"contamination={if_best['contamination']:.2f} "
        f"F1={_fmt_metric(if_best['f1'])}"
    )

    if args.write_md:
        try:
            display_input = args.input.resolve().relative_to(
                Path(__file__).resolve().parents[1]
            )
        except ValueError:
            display_input = args.input
        markdown = render_markdown(
            input_path=display_input,
            z_results=z_results,
            z_best=z_best,
            if_results=if_results,
            if_best=if_best,
            label_counts=label_counts,
        )
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(markdown, encoding="utf-8")
        print(f"Wrote {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
