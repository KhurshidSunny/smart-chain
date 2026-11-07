# Smart-Chain — Project Overview

Problem, design, analytics methods, evaluation results, and local setup in one page.

**Original FYP team:** Khurshid Khan, Aftab Alam, Afaq Ajaz  
**Supervisor:** Mr. Omar Bin Samin (IMSciences) · **Mentoring:** Code for Pakistan  
**Analytics extension:** Khurshid Khan Ahmadzai

---

## 1. Problem

Small and mid-size supply-chain operations often keep orders, stock, and warehouse steps in separate tools, and plan demand with spreadsheets. Smart-Chain provides one order-to-delivery system, then adds lightweight decision support on the same data:

1. How much demand should we expect over the next 7–30 days?
2. Which products should we reorder, and roughly how many units?
3. Which order quantities look unusual compared with that product's history?

## 2. Architecture

Five operational Node.js/Express microservices (IAM, Sales, Inventory, Warehouse, Logistics) communicate through RabbitMQ and store data in one shared MongoDB database. The post-FYP **Analytics** service (port 3006) reads that same database, validates IAM JWTs, and serves forecasts, reorder suggestions, and anomaly flags to the React frontend. This is an MVP service architecture with shared storage, not a strict database-per-service split.

- Diagram and service ownership table: [README — Architecture overview](../README.md#architecture-overview)
- Order sequence, routing keys, and ack behaviour: [order-lifecycle.md](./order-lifecycle.md)
- Demand lineage, shared storage, and consistency limits: [analytics-data-lineage.md](./analytics-data-lineage.md)
- Algorithms and API details: [analytics-technical-note.md](./analytics-technical-note.md)

## 3. Methods

| Question | Live method (Analytics service) | Offline comparison (`experiments/`) |
|---|---|---|
| Demand forecast | Croston when intermittent (≥ 40% zero days); else ES (α ≈ 0.3, ≥ 7 days) or moving average; approx. 80% residual band + short operator explanation | Same classical methods + sklearn lag Ridge; residual band mirrored in Python |
| Forecast quality | One-step holdout on recent days → MAE / MAPE | Same holdout protocol for all methods |
| Reorder | `max(0, ⌈forecast⌉ + reorderPoint − stock)` | — |
| Low stock signal | RabbitMQ `analytics.low_stock.predicted` when a scheduled check finds `predictedDemand > stockLevel` and the stored signal changed or the cooldown elapsed | Log subscriber in Analytics (demo) |
| Order anomalies | Z-score vs same-product history (default threshold 2.5, needs 3+ prior lines) | Isolation Forest on `[quantity, quantity − peer_mean]` |

## 4. Key metrics (demo data)

All numbers come from small synthetic demo datasets in `experiments/data/`. They show that the evaluation pipeline works; they are not production results.

**Forecast holdout (7-day horizon, 3 holdout days):**

| Product | Best classical by MAE | MAE | MAPE | Notes |
|---|---|---:|---:|---|
| `sku-oil-1l` | Exponential smoothing | 1.05 | 14.15% | Dense demand |
| `sku-rice-1kg` | Moving average | 3.24 | 16.27% | Dense demand |
| `sku-spare-filter` | Moving average | 2.00 | 78.57% | Intermittent; Croston MAPE 47.61% (best classical MAPE) |

On the intermittent SKU, Croston cuts MAPE roughly in half vs MA/ES while MAE stays similar. Sklearn Ridge had the lowest MAE on that series but a higher MAPE. Full table: [forecast-comparison-results.md](./forecast-comparison-results.md)

**Anomaly detection (42 labeled rows: 34 normal, 8 injected anomalies):**

| Method | Best setting by F1 | Precision | Recall | F1 |
|---|---|---:|---:|---:|
| Z-score | threshold = 2.0 | 1.00 | 0.50 | 0.67 |
| Isolation Forest | contamination = 0.20 | 1.00 | 0.88 | 0.93 |

The live service keeps z-score (default 2.5) because it is simple to explain to operators; Isolation Forest is an offline comparison. Full tables: [anomaly-evaluation-results.md](./anomaly-evaluation-results.md)

## 4b. Public retail forecast evaluation

A separate offline run scores seasonal naive, moving average, exponential smoothing, Croston, and a Ridge lag model on daily demand from UCI Online Retail II. Origins are chronological. Each origin trains only on earlier days. Validation chooses a method per series; the published comparison is the later test block. Dense and intermittent series are reported separately, including how test error moves across folds.

Every retail number is in [retail-forecast-evaluation.md](./retail-forecast-evaluation.md), rendered from [samples/retail_rolling_forecast_summary.json](./samples/retail_rolling_forecast_summary.json). `python generate_reports.py --check` rebuilds that markdown from the summary. It does not re-score the workbook. The demo table in section 4 stays a controlled synthetic check.

## 5. Reproduce the demo (5 steps)

1. **Start dependencies.** RabbitMQ on `5672` (`docker compose up -d rabbitmq`) and MongoDB (Atlas URI in each service `.env`, or local). Copy every `.env.example` to `.env`.
2. **Seed data.** In `microservices/iam`: `npm install`, `npm run init-roles`, `npm run seed-users`. In `microservices/inventory`: `npm run seed-products`.
3. **Start services.** Run `microservices/start-all.bat` (IAM–Logistics + Analytics on 3006), then `cd frontend-1 && npm install && npm run dev` and open http://localhost:5173.
4. **Create history and view analytics.** Log in as `customer@smartchain.local` / `Customer123!` and place several orders, repeating the same SKU with varied quantities. Then log in as `inventory@smartchain.local` / `Inventory123!` → Inventory Dashboard for the forecast and reorder cards, and as `sales@smartchain.local` / `Sales123!` → Orders for anomaly badges.
5. **Re-run the offline evaluations.**

   ```powershell
   cd experiments
   pip install -r requirements.txt
   python generate_reports.py --check
   python generate_reports.py
   ```

Health check without login: http://localhost:3006/health. `/ready` reports MongoDB and, when configured, RabbitMQ. `/metrics` summarizes requests and events. Log lines for one order share `correlationId`.

The Vite app at http://localhost:5173 is on the default CORS allowlist. A customer token can load that customer's order anomaly badges. Reorder and forecast cards are for the inventory manager and admin accounts above.

Pushes and pull requests run the same checks in GitHub Actions (Node 20, Python 3.13). Deployment on `main` starts only after that workflow succeeds:

```powershell
cd microservices/analytics
npm ci
npm test

cd ../../frontend-1
npm ci
npm run lint
npm run build

cd ../experiments
pip install -r requirements.txt
python generate_reports.py --check
```

Operational services (IAM, Sales, Inventory, Warehouse, Logistics) also run `npm ci` and `node --check app.js`. Do not run their `npm test` scripts; those are placeholders that exit 1.

Optional stress check: [demand-shock-simulation.md](./demand-shock-simulation.md) shows how MA/ES and a last-day z-score change when the end of a demo series is spiked.

Downloadable forecast holdout rows (productId, method, mae, mape): [samples/evaluation_rows.csv](./samples/evaluation_rows.csv). Run metadata: [samples/experiment-run-manifest.json](./samples/experiment-run-manifest.json). Regenerate or check both with `python generate_reports.py` / `python generate_reports.py --check` from `experiments/`.

## 6. FYP vs post-FYP work

| Part | When | Who |
|---|---|---|
| Microservices order flow (IAM, Sales, Inventory, Warehouse, Logistics), RabbitMQ events, JWT/RBAC, React UI, QR picking/packing, shipment tracking | FYP, 2024–2025 | Three-person team |
| Analytics service (demand history, forecast, reorder, anomalies) and its UI integration | Post-FYP, 2025–2026 | Khurshid Khan Ahmadzai |
| Python experiments, forecast comparison, anomaly evaluation, technical note | Post-FYP, 2026 | Khurshid Khan Ahmadzai |

Blockchain and IoT were studied in the FYP report but not implemented.

## 7. Limitations

- The demo forecast and anomaly tables use small synthetic datasets with short holdout windows.
- The public retail evaluation is offline only. It does not replace the live Analytics forecast. Measured rankings are in the retail results document, not in the demo table.
- Anomaly labels are injected for method testing, not real fraud labels; the detector flags unusual order sizes only.
- Forecasts need repeated orders for the same SKU; Croston is used when demand is intermittent (≥ 40% zero days), but very sparse series with few demand events remain hard.
- Uncertainty bands are residual-based approximations on short demo histories, not calibrated probabilistic intervals.
- Reorder output is advisory; no purchase orders are created automatically.
- Methods are classical statistics and lightweight ML; no deep learning models are used.
