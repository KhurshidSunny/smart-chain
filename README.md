# Smart-Chain

Supply chain management MVP built as a **BS Software Engineering Final Year Project** (2024–2025).

**Team:** Khurshid Khan, Aftab Alam, Afaq Ajaz  
**Supervisor:** Mr. Omar Bin Samin  
**Mentoring:** Code for Pakistan  

This repository is a maintained copy of the original team project ([4f74b/smart-chain](https://github.com/4f74b/smart-chain)), kept for continued development.

## What it does

Role-based web app for a simple order-to-delivery flow:

- Auth and RBAC (admin, customer, inventory, warehouse, sales, logistics)
- Orders, stock reservation, warehouse picking/packing (QR), shipment tracking
- Event-driven microservices over RabbitMQ

Blockchain and IoT were studied in the FYP report but were **not** implemented in the MVP (timeline/budget).

## Evaluation and documentation

The post-FYP analytics extension was evaluated offline in two places. Small synthetic demo datasets check forecast methods (moving average, exponential smoothing, Croston for intermittent demand, sklearn Ridge lag model) by holdout MAE/MAPE, and order-quantity anomaly detectors (z-score, Isolation Forest) by precision, recall, and F1 on 42 labeled rows. A separate rolling-origin run scores those forecasts plus a seasonal naive baseline on daily demand from UCI Online Retail II. The demo numbers show that the evaluation pipeline works; they are not the retail results.

| Document | Contents |
|---|---|
| [Project overview](docs/FOR_REVIEWERS.md) | Problem, architecture, methods, key metrics, 5-step demo, FYP vs post-FYP work, limitations |
| [Forecast comparison results](docs/forecast-comparison-results.md) | MA vs ES vs Croston vs sklearn Ridge holdout MAE/MAPE per demo SKU |
| [Public retail forecast evaluation](docs/retail-forecast-evaluation.md) | Rolling-origin MAE, WAPE, and sMAPE on UCI Online Retail II, dense and intermittent |
| [Anomaly evaluation results](docs/anomaly-evaluation-results.md) | Z-score threshold sweep, Isolation Forest contamination sweep, best-of-each comparison |
| [Demand shock simulation](docs/demand-shock-simulation.md) | Before/after MA and ES metrics after an injected demand spike on a demo SKU |
| [Forecast evaluation CSV](docs/samples/evaluation_rows.csv) | Holdout MAE/MAPE rows (productId, method, mae, mape) for offline review |
| [Analytics technical note](docs/analytics-technical-note.md) | Algorithms, evaluation protocols, limitations, future work |
| [Order lifecycle](docs/order-lifecycle.md) | Order sequence, RabbitMQ routing keys, payloads, and current ack behaviour |
| [Analytics data lineage](docs/analytics-data-lineage.md) | How orders and stock become a daily series, forecast, reorder row, event, and UI card |

Pushes and pull requests run Analytics tests, frontend-1 lint/build, experiment report `--check`, and a package/syntax check for IAM, Sales, Inventory, Warehouse, and Logistics. Deployment on `main` starts only after those checks pass. Commands: [Project overview](docs/FOR_REVIEWERS.md#5-reproduce-the-demo-5-steps).

## Stack

| Layer | Tech |
|---|---|
| Frontend (active) | React + Vite + Tailwind (`frontend-1`) |
| Backend | Node.js + Express microservices |
| Database | MongoDB |
| Events | RabbitMQ (topic exchange) |
| Auth | JWT + roles |

> Use **`frontend-1`**. The `frontend/` folder is legacy.

## Microservices

| Service | Port | Responsibility |
|---|---|---|
| IAM | 3001 | Auth, users, roles, addresses |
| Sales | 3002 | Orders |
| Inventory | 3003 | Products and stock |
| Warehouse | 3004 | Picking lists and packages |
| Logistics | 3005 | Shipments and tracking |
| Analytics | 3006 | Demand history, forecast, reorder, anomalies (post-FYP) |

## Architecture overview

Event-driven order flow uses RabbitMQ between the operational services. Each message is a version 1 envelope (`eventId`, `eventType`, `eventVersion`, `occurredAt`, `producer`, `correlationId`, `causationId`, `payload`) and is published as a persistent message with publisher confirms. `correlationId` follows the order id through the order flow. Analytics is mainly a **read-side decision-support service**: it uses the same MongoDB data and IAM JWTs. It does **not** join the order-flow write path, but it may publish an advisory `LowStockPredicted` event when forecasted demand exceeds stock.

```mermaid
flowchart LR
  UI["frontend-1<br/>React / Vite"]

  subgraph ops ["Operational microservices"]
    IAM["IAM :3001"]
    Sales["Sales :3002"]
    Inv["Inventory :3003"]
    Wh["Warehouse :3004"]
    Log["Logistics :3005"]
  end

  An["Analytics :3006<br/>forecast · reorder · anomalies"]
  MQ["RabbitMQ<br/>topic exchange"]
  DB[(MongoDB)]

  UI -->|REST + JWT| IAM
  UI --> Sales
  UI --> Inv
  UI --> Wh
  UI --> Log
  UI --> An

  Sales <--> MQ
  Inv <--> MQ
  Wh <--> MQ
  Log <--> MQ
  An -->|LowStockPredicted| MQ

  IAM --> DB
  Sales --> DB
  Inv --> DB
  Wh --> DB
  Log --> DB
  An --> DB
```

The order sequence, routing keys, payloads, and current ack behaviour are in [docs/order-lifecycle.md](docs/order-lifecycle.md). `LowStockPredicted` is advisory and is not one of the order-flow events. How those operational records become a forecast is in [docs/analytics-data-lineage.md](docs/analytics-data-lineage.md). Analytics reads the shared `smartchain` database; it does not own a separate database.

**Who owns what (analytics):**

| Capability | Owner | Notes |
|---|---|---|
| Demand history | **Analytics** | Built from sales order lines (inventory `sold` as fallback) |
| Short-horizon forecast (MA / ES) + holdout MAE/MAPE | **Analytics** | `GET /forecast/:productId` |
| Forecast method comparison (MA vs ES vs Croston; optional sklearn cache) | **Analytics** | `GET /forecast/:productId/compare` |
| Reorder suggestions | **Analytics** | Advisory only; does not create POs |
| `LowStockPredicted` event | **Analytics** | RabbitMQ when `predictedDemand > stockLevel` on `GET /reorder` |
| Order-quantity anomaly flags (z-score) | **Analytics** | Shown on sales/admin order UI |
| Auth / JWT issuance | **IAM** | Analytics validates the same `JWT_SECRET` |
| Stock, picking, shipping | Inventory / Warehouse / Logistics | Unchanged by analytics |

## Local setup

The container stack runs the active frontend and the six services with MongoDB and RabbitMQ on one machine. It does not need a cloud database account. Images use Node 20, the same major version as `.nvmrc`. Experiment scripts stay on the host and use Python 3.13 from `.python-version`.

```bash
node scripts/local-stack.js start
node scripts/local-stack.js seed
```

App: http://localhost:5173

RabbitMQ management: http://localhost:15672 (user `smartchain`, password `smartchain`). That account is only for the container network. A service started on the host still uses `guest` at `127.0.0.1`, as in each service `.env.example`.

Stop the stack with `node scripts/local-stack.js stop`. Named volumes keep the database.

**Host setup, without the app containers:** Node.js 20, RabbitMQ on `5672`, and MongoDB on `27017` or a `MONGO_URI` you already have.

```bash
# RabbitMQ only (if MongoDB is already set in each service .env)
docker compose up -d rabbitmq

# Or MongoDB and RabbitMQ only, with services still run on the host:
# docker compose up -d mongodb rabbitmq

# IAM: roles + demo users (once; against Atlas or local MONGO_URI in .env)
cd microservices/iam
cp .env.example .env   # repeat for each service; set MONGO_URI / JWT_SECRET / RABBITMQ_URL
npm install
npm run init-roles
npm run seed-users

# Optional demo catalog
cd ../inventory
npm install
npm run seed-products

# Start all backends (Windows)
# from microservices/: start-all.bat

# Frontend (localhost API URLs in frontend-1/.env)
cd frontend-1
npm install
npm run dev
```

App: http://localhost:5173

For local runs: keep `RABBITMQ_URL=amqp://guest:guest@127.0.0.1:5672` and `frontend-1` `VITE_API_*` on `http://localhost:3001`–`3006`. Atlas `MONGO_URI` does not require a local database process.

### Demo accounts

| Email | Password | Role |
|---|---|---|
| admin@smartchain.local | Admin123! | admin |
| customer@smartchain.local | Customer123! | customer |
| inventory@smartchain.local | Inventory123! | inventory_manager |
| warehouse@smartchain.local | Warehouse123! | warehouse_staff |
| sales@smartchain.local | Sales123! | sales_manager |
| logistics@smartchain.local | Logistics123! | logistics_manager |

Copy each service `.env.example` → `.env` (including `analytics` and `frontend-1`). Do not commit `.env` files.

Without Docker MongoDB, you can use the in-memory helper: `cd tools && npm install && npm run mongo`.

## Analytics service (post-FYP extension)

Decision-support module on the same MongoDB data. It exposes JWT-protected APIs used by `frontend-1` for the inventory dashboard (demand forecast, reorder suggestions) and order anomaly badges.

### Features

| Feature | Method | Where you see it |
|---|---|---|
| Demand history | Daily sold quantities from sales orders (inventory `sold` only as fallback) | API: `GET /demand/:productId` |
| Forecast | Croston when demand is intermittent (≥ 40% zero days); else exponential smoothing (≥ 7 points) or moving average; approx. 80% residual uncertainty band + operator explanation | Inventory → Demand Forecast card (via reorder batch) |
| Reorder suggestions | `suggestedQty ≈ forecastDemand + reorderPoint − stock` (when positive) | Inventory → Reorder Suggestions |
| Low-stock signal | Publishes `analytics.low_stock.predicted` when `predictedDemand > stockLevel` | Analytics logs (+ RabbitMQ); response field `lowStockEventsPublished` |
| Anomalies | Z-score of an order line quantity vs that **product’s** past line quantities | Orders list/detail badges |

Default horizons: **7 / 14 / 30** days. Anomaly flagging needs enough **same-product** history (about 3+ prior lines); a few one-off orders on different SKUs will show “None”.

### Scope

- Forecasts and reorder suggestions are advisory; they do not place purchase orders automatically.
- `LowStockPredicted` is advisory only (log subscriber demo); no PO or stock write is triggered.
- Demo catalogs are limited; outputs improve as more orders are recorded for the same SKU.
- Anomaly flags compare line quantity against that product’s history (unusual order size), not payment or account fraud.
- Analytics reads MongoDB and may publish `analytics.low_stock.predicted`. Sales, Inventory, Warehouse, and Logistics still own the order-flow events.

### Run analytics locally

Requires MongoDB (same `smartchain` DB — Atlas or local) and a matching `JWT_SECRET` with IAM.

**If using local MongoDB** (skip if `MONGO_URI` already points to Atlas):

```bash
# Option A — Docker
docker compose up -d mongodb rabbitmq

# Option B — in-memory Mongo on port 27017 (no Docker; keep the window open)
cd tools
npm install
npm run mongo
```

For RabbitMQ without Docker, install [RabbitMQ for Windows](https://www.rabbitmq.com/docs/install-windows) or start a local install on `5672`. Analytics needs MongoDB always; set `RABBITMQ_URL` (see `.env.example`) if you want `LowStockPredicted` events. Without RabbitMQ, reorder still works and publish is skipped with a warning.

```bash
cd microservices/analytics
cp .env.example .env
npm install
npm start
# or: npm run dev
```

Health check: http://localhost:3006/health

| Endpoint | Description |
|---|---|
| `GET /demand/:productId` | Daily demand history for a product |
| `GET /forecast/:productId` | Short-horizon demand forecast + optional holdout `evaluation` (`mae` / `mape`) |
| `GET /forecast/:productId/compare` | Side-by-side MA / ES / Croston holdout on live history; sklearn metrics from offline cache when available |
| `GET /reorder` | Reorder suggestions for active products; publishes `LowStockPredicted` when forecast exceeds stock |
| `GET /anomalies` | Order quantity anomalies |

**`LowStockPredicted` (RabbitMQ):** routing key `analytics.low_stock.predicted` on `smartchain_exchange`. Emitted from `GET /reorder` for each active product where `predictedDemand > stockLevel`. Example payload fields: `event`, `productId`, `sku`, `name`, `stockLevel`, `predictedDemand`, `horizonDays`, `forecastMethod`, `reorderPoint`, `suggestedQuantity`, `emittedAt`. Analytics binds `smart-chain-analytics_events` and logs each event for demo.

`GET /forecast/:productId` returns `data.evaluation` when there is enough daily history for a holdout check; otherwise `evaluation` is `null`. Example fields: `holdoutDays`, `pointsEvaluated`, `mae`, `mape`.

`GET /forecast/:productId/compare` always computes moving-average, exponential-smoothing, and Croston evaluations from Mongo demand history. The live forecast path selects Croston when the series is intermittent. Sklearn Ridge lag metrics are optional and loaded from `microservices/analytics/data/sklearn_holdout_cache.json` (demo SKU keys such as `sku-rice-1kg`). Use `?sklearnKey=sku-rice-1kg` to attach demo sklearn numbers while classical methods still use the live `:productId` history.

All analytics routes except `/health` need a Bearer JWT from IAM.

In `frontend-1`, set `VITE_API_ANALYTICS_URL=http://localhost:3006` (see `.env.example`). `microservices/start-all.bat` launches IAM–Logistics **and** Analytics (3006). Or start analytics alone as above.

### How to demo

1. Seed users/products; place several orders as **customer** (repeat the **same SKU** with varied quantities if you want anomaly badges).
2. Login as **inventory** → Inventory Dashboard → forecast + reorder cards.
3. Login as **sales/admin** → Orders → anomaly column / order detail.

## License / academic note

FYP materials remain subject to institute rules. This repo is for learning and further development of the project.
