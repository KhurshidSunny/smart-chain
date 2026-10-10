# Smart-Chain Analytics — Technical Note

**Project:** Smart-Chain (BS Software Engineering Final Year Project + post-FYP extension)  
**Authors / team:** Khurshid Khan, Aftab Alam, Afaq Ajaz  
**Supervisor:** Mr. Omar Bin Samin  
**Mentoring:** Code for Pakistan  
**Scope of this note:** the Analytics microservice (port 3006), its algorithms, and offline evaluation evidence.

This document covers architecture, methods, evaluation protocol, and limitations for the analytics extension. Detailed numeric tables live in the linked results files.

---

## 1. Problem

Small and mid-size supply-chain operations often run on fragmented software: orders, stock, and warehouse steps live in different tools, while “how much will we need next week?” is answered with spreadsheets or gut feel.

Smart-Chain’s FYP MVP already covers an order-to-delivery flow with microservices (IAM, Sales, Inventory, Warehouse, Logistics). Operators still need lightweight **decision support**:

1. What demand should we expect over the next 7–30 days?
2. Which products should we reorder, and roughly how many units?
3. Which order line quantities look unusual compared with that product’s history?

The analytics extension answers these questions on the **same MongoDB data**, without claiming a full enterprise planning or fraud system.

---

## 2. System context

```
Orders / inventory data (MongoDB)
        │
        ▼
 Analytics service (Express, JWT)
   ├── demand aggregation
   ├── forecast (+ optional method compare)
   ├── reorder suggestions
   ├── LowStockPredicted (RabbitMQ, advisory)
   └── anomaly detection (z-score live)
        │
        ├──► frontend-1 (inventory dashboard, order badges)
        └──► RabbitMQ topic exchange (analytics.low_stock.predicted)
```

- Analytics is a **separate service** (`microservices/analytics`) behind the same JWT secret as IAM.
- It **reads** existing collections (orders, products, optionally inventory transactions). It does not replace Sales or Inventory write paths.
- On `GET /reorder`, when `predictedDemand > stockLevel`, it publishes an advisory **`LowStockPredicted`** event (`analytics.low_stock.predicted`). A log subscriber in Analytics is enough for demo; no PO is created.
- **Live path:** moving average / exponential smoothing (forecast), z-score (anomalies).
- **Offline experiments:** sklearn lag (Ridge) forecast baseline; Isolation Forest anomaly baseline. These strengthen the research comparison story; they are not required for the UI demo.

---

## 3. Methods

### 3.1 Demand history

Daily demand per product is aggregated mainly from **sales order line quantities** by day. Inventory `sold` transactions are used only as a fallback when order-based history is insufficient, to avoid double-counting reserved and sold events.

### 3.2 Forecast

For a chosen horizon (default options: **7, 14, 30** days):

| Situation | Method | Idea |
|-----------|--------|------|
| Short history | Moving average over a lookback window | Average recent daily demand × horizon |
| Enough daily points (≥ 7) | Exponential smoothing (α ≈ 0.3) | Recent days weigh more than older days |

Output includes average daily demand, predicted demand over the horizon, points used, and `forecastMethod`.

When enough daily history exists, `GET /forecast/:productId` also returns an `evaluation` object from a small holdout check (recent days scored with one-step predictions): `holdoutDays`, `pointsEvaluated`, `mae`, and `mape`. If history is too short or empty, `evaluation` is `null`.

An optional offline / API comparison adds a **sklearn lag (Ridge)** baseline on the same holdout protocol. See [Section 4](#4-forecast-comparison-evaluation).

### 3.3 Reorder suggestion

For each **active** product:

\[
\text{suggestedQuantity} = \max(0,\ \lceil\text{predictedDemand}\rceil + \text{reorderPoint} - \text{stockLevel})
\]

A human-readable `reason` explains whether stock is below reorder point and/or forecast exceeds available stock.

When forecasted demand exceeds current stock (`predictedDemand > stockLevel`), Analytics also publishes:

| Field | Meaning |
|---|---|
| Routing key | `analytics.low_stock.predicted` |
| `event` | `"LowStockPredicted"` |
| `productId` / `sku` / `name` | Product identity |
| `stockLevel` / `predictedDemand` / `horizonDays` | Comparison inputs |
| `forecastMethod` / `reorderPoint` / `suggestedQuantity` | Context from the reorder calculation |
| `emittedAt` | ISO timestamp |

The reorder HTTP response includes `lowStockEventsPublished` (count of events attempted). If RabbitMQ is down, reorder JSON is still returned and publish is skipped with a warning.

### 3.4 Order quantity anomalies

For each non-cancelled order line, quantity is compared to that **product’s** historical line quantities (excluding the current order):

- Need enough history (about **3+** prior points) before scoring.
- Compute mean and sample standard deviation; flag by **z-score** against a threshold (default **2.5**).
- Severity bands (`medium` / `high`) and a plain-language `reason` are returned for the UI.

This detects unusual **order sizes**, not account takeover or payment fraud.

An offline **Isolation Forest** baseline uses the same labeled demo set for method comparison. See [Section 5](#5-anomaly-evaluation-protocol).

---

## 4. Forecast comparison evaluation

**Detail file:** [forecast-comparison-results.md](./forecast-comparison-results.md)

**Protocol (honest, demo-scale):**

- Same daily demand series and the same short one-step holdout (recent days held out, refit on earlier history).
- Metrics: **MAE** and **MAPE**.
- Methods compared: Moving Average, Exponential Smoothing, and sklearn lag (Ridge).
- Regenerated from `experiments/compare_forecast_methods.py` using `experiments/data/demo_daily_demand.json`.

**What the demo tables show (summary):**

| Product | Best holdout MAE (this demo file) |
|---------|-----------------------------------|
| `sku-oil-1l` | Exponential smoothing |
| `sku-rice-1kg` | Moving average |

Rankings can change with longer or noisier series. Sklearn needs enough history to build lag rows; very short SKUs are skipped.

**Live API:** `GET /forecast/:productId/compare` (JWT) returns classical MA/ES metrics from MongoDB history and optional sklearn metrics from a small cache file when a `sklearnKey` is provided.

This is **decision-support evaluation on demo demand**, not a claim of production deep learning or retail-scale forecasting.

---

## 5. Anomaly evaluation protocol

**Detail file:** [anomaly-evaluation-results.md](./anomaly-evaluation-results.md)

**Protocol:**

- Labeled demo rows in `experiments/data/anomaly_labels.json` (injected ground truth for method tests, not production fraud labels).
- Leave-one-out history per `productId` (same-product peers), min history **3** points — aligned with the live Analytics service.
- **Z-score:** threshold sweep (2.0 / 2.5 / 3.0); live default remains **2.5**.
- **Isolation Forest (offline):** features `[quantity, quantity - peer_mean]`; contamination sweep (0.10 / 0.15 / 0.20).
- Metrics: precision, recall, F1 (plus TP/FP/TN/FN counts).

**What the demo tables show (summary):**

| Method | Best setting (by F1 on this set) | Precision | Recall | F1 |
|--------|----------------------------------|-----------|--------|-----|
| Z-score | threshold = 2.0 | 1.00 | 0.50 | 0.67 |
| Isolation Forest | contamination = 0.20 | 0.89 | 1.00 | 0.94 |

Live Analytics still uses **z-score**. Isolation Forest is an offline second detector for comparison. Small synthetic sets can favor one method; do not treat these numbers as a production SLA.

Regenerate with:

```powershell
cd experiments
python evaluate_zscore_anomalies.py --write-md
python compare_isolation_forest_anomalies.py --write-md
```

---

## 6. Results to verify locally

With seeded demo products and a handful of customer orders:

- Inventory managers see a **7-day demand forecast summary** and **reorder suggestions** with suggested quantities.
- Sales/admin users see **anomaly badges** when the same SKU has enough history and a line quantity is statistically unusual.
- APIs: `GET /health`, `/demand/:productId`, `/forecast/:productId`, `/forecast/:productId/compare`, `/reorder`, `/anomalies` (JWT required except health).

Exact numeric outputs depend on the demo data you place; empty history fails safely (zeroed forecast / no false anomalies). For downloadable evaluation tables, use the two results markdown files linked above.

---

## 7. Limitations

- Suited to demo and pilot use; not a full enterprise demand-planning or fraud system.
- Sparse or intermittent order history reduces forecast and anomaly usefulness.
- Anomalies require **repeated purchases of the same product**; unrelated SKUs may show no flags.
- Reorder output is advisory only—no automatic purchase orders are created.
- Forecast and anomaly evaluations use **small synthetic / demo datasets**; holdout windows are short by design (aligned with the live service).
- Sklearn and Isolation Forest baselines are **offline / optional**; they are not the production UI path.
- No deep learning models are claimed or deployed.

---

## 8. Future work

Possible next steps for research or a Master’s thesis direction:

1. Extend the offline comparison in [forecast-comparison-results.md](./forecast-comparison-results.md) to larger public retail datasets (beyond the demo SKUs).
2. Intermittent-demand methods (e.g. Croston-style) for sparse SKUs.
3. Calibrated uncertainty and better operator explanations.
4. Stronger evaluation harness and regression tests around forecast/anomaly pipelines.
5. Optionally wire Isolation Forest (or another second detector) behind a feature flag if a labelled operational set becomes available.

---

## 9. How to run

See the root [README](../README.md) — Analytics service section. Typical path: start MongoDB → seed IAM/inventory → start backends + analytics on **3006** → `frontend-1` with `VITE_API_ANALYTICS_URL`.

---

## Related documents

| Document | Role |
|----------|------|
| [forecast-comparison-results.md](./forecast-comparison-results.md) | MA / ES / sklearn holdout tables |
| [anomaly-evaluation-results.md](./anomaly-evaluation-results.md) | Z-score vs Isolation Forest metrics |
| [demand-shock-simulation.md](./demand-shock-simulation.md) | Before/after forecast metrics under an injected demand spike |
| [samples/evaluation_rows.csv](./samples/evaluation_rows.csv) | Holdout MAE/MAPE CSV export (productId, method, mae, mape) |

---

*This document describes the post-FYP analytics extension as implemented in this repository. Academic FYP materials remain subject to institute rules.*
