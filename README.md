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

## Local setup

**Requirements:** Node.js 18+, MongoDB on `27017`, RabbitMQ on `5672` (or `docker compose up -d`).

```bash
# Infra (optional if you already run MongoDB + RabbitMQ)
docker compose up -d

# IAM: roles + demo users
cd microservices/iam
cp .env.example .env   # repeat for each service
npm install
npm run init-roles
npm run seed-users

# Optional demo catalog
cd ../inventory
npm install
npm run seed-products

# Start all backends (Windows)
# from microservices/: start-all.bat

# Frontend
cd frontend-1
npm install
npm run dev
```

App: http://localhost:5173

### Demo accounts

| Email | Password | Role |
|---|---|---|
| admin@smartchain.local | Admin123! | admin |
| customer@smartchain.local | Customer123! | customer |
| inventory@smartchain.local | Inventory123! | inventory_manager |
| warehouse@smartchain.local | Warehouse123! | warehouse_staff |
| sales@smartchain.local | Sales123! | sales_manager |
| logistics@smartchain.local | Logistics123! | logistics_manager |

Copy each service `.env.example` → `.env`. Do not commit `.env` files.

Without Docker MongoDB, you can use the in-memory helper: `cd tools && npm install && npm run mongo`.

## Planned work

An **AI decision-support layer** (for example demand forecasting or inventory alerts) is planned as a separate extension on top of this MVP. It is not part of the original FYP deliverable.

## License / academic note

FYP materials remain subject to institute rules. This repo is for learning and further development of the project.
