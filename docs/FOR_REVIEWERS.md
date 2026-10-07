# Smart-Chain — Guide



**Author of the post-FYP extension:** Khurshid Khan Ahmadzai  
**Original FYP team:** Khurshid Khan, Aftab Alam, Afaq Ajaz  
**Supervisor:** Mr. Omar Bin Samin (IMSciences) · **Mentoring:** Code for Pakistan

---

## 1. Problem

Small and mid-size supply-chain operations often keep orders, stock, and warehouse steps in separate tools, and plan demand with spreadsheets. Smart-Chain provides one order-to-delivery system, then adds lightweight decision support on the same data:

1. How much demand should we expect over the next 7–30 days?
2. Which products should we reorder, and roughly how many units?
3. Which order quantities look unusual compared with that product's history?

## 2. Architecture

Five operational Node.js/Express microservices (IAM, Sales, Inventory, Warehouse, Logistics) communicate through RabbitMQ and store data in MongoDB. The post-FYP **Analytics** service (port 3006) reads the same MongoDB data, validates IAM JWTs, and serves forecasts, reorder suggestions, and anomaly flags to the React frontend.

- Diagram and service ownership table: [README — Architecture overview](../README.md#architecture-overview)
- Algorithms and API details: [analytics-technical-note.md](./analytics-technical-note.md)

## 3. Methods

| Question | Live method (Analytics service) | Offline comparison (`experiments/`) |
|---|---|---|
| Demand forecast | Moving average (short history); exponential smoothing, α ≈ 0.3 (≥ 7 daily points) | Sklearn lag-feature Ridge regression |
| Forecast quality | One-step holdout on recent days → MAE / MAPE | Same holdout protocol for all methods |
| Reorder | `max(0, ⌈forecast⌉ + reorderPoint − stock)` | — |
| Order anomalies | Z-score vs same-product history (default threshold 2.5, needs 3+ prior lines) | Isolation Forest on `[quantity, quantity − peer_mean]` |

## 4. Key metrics (demo data)

All numbers come from small synthetic demo datasets in `experiments/data/`. They show that the evaluation pipeline works; they are not production results.

**Forecast holdout (7-day horizon, 3 holdout days):**

| Product | Best method by MAE | MAE | MAPE |
|---|---|---:|---:|
| `sku-oil-1l` | Exponential smoothing | 1.05 | 14.15% |
| `sku-rice-1kg` | Moving average | 3.24 | 16.27% |

The sklearn Ridge baseline was worse on both demo series (MAPE 22.46% and 30.54%). Full table: [forecast-comparison-results.md](./forecast-comparison-results.md)

**Anomaly detection (42 labeled rows: 34 normal, 8 injected anomalies):**

| Method | Best setting by F1 | Precision | Recall | F1 |
|---|---|---:|---:|---:|
| Z-score | threshold = 2.0 | 1.00 | 0.50 | 0.67 |
| Isolation Forest | contamination = 0.20 | 0.89 | 1.00 | 0.94 |

The live service keeps z-score (default 2.5) because it is simple to explain to operators; Isolation Forest is an offline comparison. Full tables: [anomaly-evaluation-results.md](./anomaly-evaluation-results.md)

## 5. Reproduce the demo (5 steps)

1. **Start dependencies.** RabbitMQ on `5672` (`docker compose up -d rabbitmq`) and MongoDB (Atlas URI in each service `.env`, or local). Copy every `.env.example` to `.env`.
2. **Seed data.** In `microservices/iam`: `npm install`, `npm run init-roles`, `npm run seed-users`. In `microservices/inventory`: `npm run seed-products`.
3. **Start services.** Run `microservices/start-all.bat` (IAM–Logistics + Analytics on 3006), then `cd frontend-1 && npm install && npm run dev` and open http://localhost:5173.
4. **Create history and view analytics.** Log in as `customer@smartchain.local` / `Customer123!` and place several orders, repeating the same SKU with varied quantities. Then log in as `inventory@smartchain.local` / `Inventory123!` → Inventory Dashboard for the forecast and reorder cards, and as `sales@smartchain.local` / `Sales123!` → Orders for anomaly badges.
5. **Re-run the offline evaluations.**

   ```powershell
   cd experiments
   pip install -r requirements.txt
   python compare_forecast_methods.py --write-md
   python evaluate_zscore_anomalies.py --write-md
   python compare_isolation_forest_anomalies.py --write-md
   ```

Health check without login: http://localhost:3006/health

## 6. FYP vs post-FYP work

| Part | When | Who |
|---|---|---|
| Microservices order flow (IAM, Sales, Inventory, Warehouse, Logistics), RabbitMQ events, JWT/RBAC, React UI, QR picking/packing, shipment tracking | FYP, 2024–2025 | Three-person team |
| Analytics service (demand history, forecast, reorder, anomalies) and its UI integration | Post-FYP, 2025–2026 | Khurshid Khan Ahmadzai |
| Python experiments, forecast comparison, anomaly evaluation, technical note | Post-FYP, 2026 | Khurshid Khan Ahmadzai |

Blockchain and IoT were studied in the FYP report but not implemented.

## 7. Limitations

- Evaluations use small synthetic datasets with short holdout windows; rankings can change on real, longer, or noisier data.
- Anomaly labels are injected for method testing, not real fraud labels; the detector flags unusual order sizes only.
- Forecasts need repeated orders for the same SKU; sparse or intermittent demand reduces quality.
- Reorder output is advisory; no purchase orders are created automatically.
- No deep learning is used or claimed.


