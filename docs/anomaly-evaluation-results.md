# Anomaly detection evaluation

Offline comparison of the Analytics z-score detector and an Isolation Forest
baseline on the same labeled demo set. Labels are injected demo ground truth,
not production fraud labels.

## Setup

- Input: `experiments/data/anomaly_labels.json`
- Protocol: leave-one-out history per `productId` (same product peers)
- Min history points: **3**
- Z-score rule aligned with `microservices/analytics/services/anomalyService.js`
- Isolation Forest features: `[quantity, quantity - peer_mean]`
- Rows: **42** (normal=34, anomaly=8)

## Z-score threshold sweep

| Threshold | Evaluated | TP | FP | TN | FN | Precision | Recall | F1 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2.0 | 42 | 4 | 0 | 34 | 4 | 1.0000 | 0.5000 | 0.6667 |
| 2.5 | 42 | 3 | 0 | 34 | 5 | 1.0000 | 0.3750 | 0.5455 |
| 3.0 | 42 | 2 | 0 | 34 | 6 | 1.0000 | 0.2500 | 0.4000 |

Best z-score threshold by F1: **2.0** (precision=1.0000, recall=0.5000, F1=0.6667)

## Isolation Forest contamination sweep

| Contamination | Evaluated | TP | FP | TN | FN | Precision | Recall | F1 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.10 | 42 | 6 | 0 | 34 | 2 | 1.0000 | 0.7500 | 0.8571 |
| 0.15 | 42 | 6 | 0 | 34 | 2 | 1.0000 | 0.7500 | 0.8571 |
| 0.20 | 42 | 8 | 1 | 33 | 0 | 0.8889 | 1.0000 | 0.9412 |

Best Isolation Forest contamination by F1: **0.20** (precision=0.8889, recall=1.0000, F1=0.9412)

## Method comparison (best of each)

| Method | Setting | Precision | Recall | F1 | Notes |
|---|---|---:|---:|---:|---|
| Z-score | threshold=2.0 | 1.0000 | 0.5000 | 0.6667 | Live Analytics default is 2.5 |
| Isolation Forest | contamination=0.20 | 0.8889 | 1.0000 | 0.9412 | sklearn; quantity + peer deviation |

## Interpretation

- Compare methods on the same labeled demo rows and leave-one-out protocol.
- Higher F1 is preferred here; precision/recall trade-offs still matter in ops.
- Small synthetic sets can favor one method; do not treat this as a production SLA.
- Near-zero injected outliers may behave differently from extreme high quantities.

## Limits

- Demo labels only (`experiments/data/anomaly_labels.json`).
- Injected extremes are for method evaluation, not claims about fraud.
- Isolation Forest is an offline baseline; the live Analytics path still uses z-score.

## How to regenerate

```powershell
cd experiments
python evaluate_zscore_anomalies.py --write-md
python compare_isolation_forest_anomalies.py --write-md
```
