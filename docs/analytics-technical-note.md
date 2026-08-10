# Smart-Chain Analytics — Technical Note

**Project:** Smart-Chain (BS Software Engineering Final Year Project + post-FYP extension)  
**Authors / team:** Khurshid Khan, Aftab Alam, Afaq Ajaz  
**Supervisor:** Mr. Omar Bin Samin  
**Mentoring:** Code for Pakistan  
**Scope of this note:** the Analytics microservice (port 3006) and its use in the inventory/order UI  

This note is written for portfolio readers and scholarship reviewers. It describes what was built, how it works, and what it is *not*.

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
   ├── forecast
   ├── reorder suggestions
   └── anomaly detection
        │
        ▼
 frontend-1 (inventory dashboard, order badges)
```

- Analytics is a **separate service** (`microservices/analytics`) behind the same JWT secret as IAM.
- It **reads** existing collections (orders, products, optionally inventory transactions). It does not replace Sales or Inventory write paths.
- Methods are **explainable statistics / heuristics**, not trained deep-learning models.

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

### 3.3 Reorder suggestion

For each **active** product:

\[
\text{suggestedQuantity} = \max(0,\ \lceil\text{predictedDemand}\rceil + \text{reorderPoint} - \text{stockLevel})
\]

A human-readable `reason` explains whether stock is below reorder point and/or forecast exceeds available stock.

### 3.4 Order quantity anomalies

For each non-cancelled order line, quantity is compared to that **product’s** historical line quantities (excluding the current order):

- Need enough history (about **3+** prior points) before scoring.
- Compute mean and sample standard deviation; flag by **z-score** against a threshold (default **2.5**).
- Severity bands (`medium` / `high`) and a plain-language `reason` are returned for the UI.

This detects unusual **order sizes**, not account takeover or payment fraud.

---

## 4. Results (what reviewers can verify locally)

With seeded demo products and a handful of customer orders:

- Inventory managers see a **7-day demand forecast summary** and **reorder suggestions** with suggested quantities.
- Sales/admin users see **anomaly badges** when the same SKU has enough history and a line quantity is statistically unusual.
- APIs: `GET /health`, `/demand/:productId`, `/forecast/:productId`, `/reorder`, `/anomalies` (JWT required except health).

Exact numeric outputs depend on the demo data you place; the system is designed so empty history fails safely (zeroed forecast / no false anomalies).

---

## 5. Limitations

- Not a production demand-planning engine; demo catalogs are often sparse or intermittent.
- Not generative AI or a multi-agent system.
- Anomalies require **repeated purchases of the same product**; four unrelated SKUs will correctly show no flags.
- No automatic purchase orders are placed—suggestions are advisory.

---

## 6. Future work (honest roadmap)

Possible next steps for research or a Master’s thesis direction:

1. Compare classical methods with a simple supervised model (e.g. gradient boosting on lag features) on larger public retail datasets, extending the existing holdout MAE/MAPE evaluation.
2. Intermittent-demand methods (e.g. Croston-style) for sparse SKUs.
3. Calibrated uncertainty and better operator explanations.
4. Stronger evaluation harness and regression tests around forecast/anomaly pipelines.

---

## 7. How to run

See the root [README](../README.md) — Analytics service section. Typical path: start MongoDB → seed IAM/inventory → start backends + analytics on **3006** → `frontend-1` with `VITE_API_ANALYTICS_URL`.

---

*This document describes the post-FYP analytics extension as implemented in this repository. Academic FYP materials remain subject to institute rules.*
