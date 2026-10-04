"""Evaluate z-score order-quantity anomaly detection with precision / recall / F1.

Uses the labeled demo set in experiments/data/anomaly_labels.json.
History for each row is leave-one-out quantities for the same productId,
matching the Analytics service idea of comparing one line to peer history.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
from typing import Any

DEFAULT_INPUT = Path(__file__).resolve().parent / "data" / "anomaly_labels.json"
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[1] / "docs" / "anomaly-evaluation-results.md"
)
DEFAULT_THRESHOLDS = (2.0, 2.5, 3.0)
MIN_HISTORY_POINTS = 3


def load_anomaly_rows(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict) and isinstance(payload.get("rows"), list):
        rows = payload["rows"]
    else:
        raise ValueError("Expected a JSON list or an object with a 'rows' array.")

    cleaned: list[dict[str, Any]] = []
    for index, row in enumerate(rows):
        if not isinstance(row, dict):
            raise ValueError(f"Row {index} is not an object.")
        product_id = str(row.get("productId") or "").strip()
        order_line_id = str(row.get("orderLineId") or f"row-{index}").strip()
        quantity = float(row.get("quantity"))
        label = int(row.get("label"))
        if product_id == "":
            raise ValueError(f"Row {index} is missing productId.")
        if label not in (0, 1):
            raise ValueError(f"Row {index} label must be 0 or 1.")
        if quantity < 0 or not math.isfinite(quantity):
            raise ValueError(f"Row {index} has an invalid quantity.")
        cleaned.append(
            {
                "orderLineId": order_line_id,
                "productId": product_id,
                "quantity": quantity,
                "label": label,
                "note": str(row.get("note") or ""),
            }
        )
    return cleaned


def mean(values: list[float]) -> float:
    return sum(values) / len(values)


def sample_std(values: list[float], average: float) -> float:
    if len(values) < 2:
        return 0.0
    variance = sum((value - average) ** 2 for value in values) / (len(values) - 1)
    return math.sqrt(variance)


def predict_anomaly(
    quantity: float,
    history: list[float],
    *,
    threshold: float,
    min_history: int = MIN_HISTORY_POINTS,
) -> bool:
    """Mirror microservices/analytics/services/anomalyService.js decision rule."""
    if len(history) < min_history:
        return False

    avg = mean(history)
    std_dev = sample_std(history, avg)

    if std_dev == 0:
        return quantity != avg

    z_score = abs((quantity - avg) / std_dev)
    return z_score >= threshold


def confusion_counts(
    y_true: list[int],
    y_pred: list[bool],
) -> dict[str, int]:
    tp = fp = tn = fn = 0
    for truth, pred in zip(y_true, y_pred):
        if truth == 1 and pred:
            tp += 1
        elif truth == 0 and pred:
            fp += 1
        elif truth == 0 and not pred:
            tn += 1
        else:
            fn += 1
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn}


def precision_recall_f1(counts: dict[str, int]) -> dict[str, float | None]:
    tp = counts["tp"]
    fp = counts["fp"]
    fn = counts["fn"]

    precision = tp / (tp + fp) if (tp + fp) else None
    recall = tp / (tp + fn) if (tp + fn) else None
    if precision is None or recall is None or (precision + recall) == 0:
        f1 = None
    else:
        f1 = 2 * precision * recall / (precision + recall)

    return {"precision": precision, "recall": recall, "f1": f1}


def evaluate_threshold(
    rows: list[dict[str, Any]],
    *,
    threshold: float,
) -> dict[str, Any]:
    y_true: list[int] = []
    y_pred: list[bool] = []
    skipped = 0

    for index, row in enumerate(rows):
        history = [
            other["quantity"]
            for j, other in enumerate(rows)
            if j != index and other["productId"] == row["productId"]
        ]
        if len(history) < MIN_HISTORY_POINTS:
            skipped += 1
            continue
        y_true.append(row["label"])
        y_pred.append(
            predict_anomaly(row["quantity"], history, threshold=threshold)
        )

    counts = confusion_counts(y_true, y_pred)
    metrics = precision_recall_f1(counts)
    return {
        "threshold": threshold,
        "evaluated": len(y_true),
        "skipped": skipped,
        **counts,
        **metrics,
    }


def _fmt_metric(value: float | None) -> str:
    if value is None:
        return "n/a"
    return f"{value:.4f}"


def choose_best_threshold(results: list[dict[str, Any]]) -> dict[str, Any]:
    """Prefer highest F1; break ties with higher precision, then higher threshold."""

    def sort_key(row: dict[str, Any]) -> tuple[float, float, float]:
        f1 = row["f1"] if row["f1"] is not None else -1.0
        precision = row["precision"] if row["precision"] is not None else -1.0
        return (f1, precision, row["threshold"])

    return max(results, key=sort_key)


def render_markdown(
    *,
    input_path: Path,
    results: list[dict[str, Any]],
    best: dict[str, Any],
    label_counts: dict[str, int],
) -> str:
    lines = [
        "# Anomaly detection evaluation (z-score)",
        "",
        "Offline evaluation of the Analytics z-score order-quantity detector on a",
        "labeled demo set. Labels are injected demo ground truth, not production",
        "fraud labels.",
        "",
        "## Setup",
        "",
        f"- Input: `{Path(input_path).as_posix()}`",
        "- Protocol: leave-one-out history per `productId` (same product peers)",
        f"- Min history points: **{MIN_HISTORY_POINTS}**",
        "- Decision rule aligned with `microservices/analytics/services/anomalyService.js`",
        "  (`|z| >= threshold`, or any difference when stdDev = 0)",
        f"- Rows: **{label_counts['total']}** "
        f"(normal={label_counts['normal']}, anomaly={label_counts['anomaly']})",
        "",
        "## Threshold sweep",
        "",
        "| Threshold | Evaluated | TP | FP | TN | FN | Precision | Recall | F1 |",
        "|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]

    for row in results:
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
            "## Best threshold on this demo set",
            "",
            f"- Best by F1 (then precision): **{best['threshold']:.1f}**",
            f"- Precision: **{_fmt_metric(best['precision'])}**",
            f"- Recall: **{_fmt_metric(best['recall'])}**",
            f"- F1: **{_fmt_metric(best['f1'])}**",
            "",
            "## Interpretation",
            "",
            "- The live Analytics default threshold is **2.5**.",
            "- Rankings on this small synthetic set can change with more products or",
            "  real operational history.",
            "- Near-zero injected outliers may be harder or easier than extreme highs,",
            "  depending on the normal quantity spread.",
            "",
            "## Limits",
            "",
            "- Demo labels only (`experiments/data/anomaly_labels.json`).",
            "- Injected extremes are for method evaluation, not claims about fraud.",
            "- Leave-one-out on a tiny SKU set is a controlled check, not a production SLA.",
            "",
            "## How to regenerate",
            "",
            "```powershell",
            "cd experiments",
            "python evaluate_zscore_anomalies.py",
            "python evaluate_zscore_anomalies.py --write-md",
            "```",
            "",
        ]
    )
    return "\n".join(lines)


def parse_thresholds(raw: str) -> list[float]:
    values = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        values.append(float(part))
    if not values:
        raise ValueError("Provide at least one threshold.")
    return values


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Evaluate z-score anomaly detection with precision/recall/F1."
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument(
        "--thresholds",
        type=str,
        default=",".join(str(value) for value in DEFAULT_THRESHOLDS),
        help="Comma-separated z thresholds (default: 2.0,2.5,3.0)",
    )
    parser.add_argument(
        "--write-md",
        action="store_true",
        help=f"Write markdown results to {DEFAULT_OUTPUT}",
    )
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    rows = load_anomaly_rows(args.input)
    thresholds = parse_thresholds(args.thresholds)
    results = [evaluate_threshold(rows, threshold=value) for value in thresholds]
    best = choose_best_threshold(results)
    label_counts = {
        "total": len(rows),
        "normal": sum(1 for row in rows if row["label"] == 0),
        "anomaly": sum(1 for row in rows if row["label"] == 1),
    }

    print(f"Loaded {label_counts['total']} labeled rows from {args.input}")
    print(
        f"normal={label_counts['normal']} anomaly={label_counts['anomaly']} "
        f"thresholds={thresholds}"
    )
    print()
    print(
        f"{'thr':>5} {'eval':>5} {'tp':>4} {'fp':>4} {'tn':>4} {'fn':>4} "
        f"{'prec':>8} {'rec':>8} {'f1':>8}"
    )
    for row in results:
        print(
            f"{row['threshold']:5.1f} {row['evaluated']:5d} {row['tp']:4d} "
            f"{row['fp']:4d} {row['tn']:4d} {row['fn']:4d} "
            f"{_fmt_metric(row['precision']):>8} {_fmt_metric(row['recall']):>8} "
            f"{_fmt_metric(row['f1']):>8}"
        )
    print()
    print(
        f"Best threshold on demo set: {best['threshold']:.1f} "
        f"(F1={_fmt_metric(best['f1'])}, "
        f"precision={_fmt_metric(best['precision'])}, "
        f"recall={_fmt_metric(best['recall'])})"
    )

    if args.write_md:
        # Prefer a stable relative path in the markdown when under the repo.
        try:
            display_input = args.input.resolve().relative_to(
                Path(__file__).resolve().parents[1]
            )
        except ValueError:
            display_input = args.input
        markdown = render_markdown(
            input_path=display_input,
            results=results,
            best=best,
            label_counts=label_counts,
        )
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(markdown, encoding="utf-8")
        print(f"Wrote {args.output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
