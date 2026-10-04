# Anomaly detection evaluation (z-score)

Offline evaluation of the Analytics z-score order-quantity detector on a
labeled demo set. Labels are injected demo ground truth, not production
fraud labels.

## Setup

- Input: `experiments/data/anomaly_labels.json`
- Protocol: leave-one-out history per `productId` (same product peers)
- Min history points: **3**
- Decision rule aligned with `microservices/analytics/services/anomalyService.js`
  (`|z| >= threshold`, or any difference when stdDev = 0)
- Rows: **42** (normal=34, anomaly=8)

## Threshold sweep

| Threshold | Evaluated | TP | FP | TN | FN | Precision | Recall | F1 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2.0 | 42 | 4 | 0 | 34 | 4 | 1.0000 | 0.5000 | 0.6667 |
| 2.5 | 42 | 3 | 0 | 34 | 5 | 1.0000 | 0.3750 | 0.5455 |
| 3.0 | 42 | 2 | 0 | 34 | 6 | 1.0000 | 0.2500 | 0.4000 |

## Best threshold on this demo set

- Best by F1 (then precision): **2.0**
- Precision: **1.0000**
- Recall: **0.5000**
- F1: **0.6667**

## Interpretation

- The live Analytics default threshold is **2.5**.
- Rankings on this small synthetic set can change with more products or
  real operational history.
- Near-zero injected outliers may be harder or easier than extreme highs,
  depending on the normal quantity spread.

## Limits

- Demo labels only (`experiments/data/anomaly_labels.json`).
- Injected extremes are for method evaluation, not claims about fraud.
- Leave-one-out on a tiny SKU set is a controlled check, not a production SLA.

## How to regenerate

```powershell
cd experiments
python evaluate_zscore_anomalies.py
python evaluate_zscore_anomalies.py --write-md
```
