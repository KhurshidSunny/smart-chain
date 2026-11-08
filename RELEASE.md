# Current tree

This file records the runtime and the checks for the tree as it stands. It is not a versioned product release.

## Runtimes

| Piece | Version | Source |
|---|---|---|
| Node.js | 20 | `.nvmrc` and the service images |
| Python | 3.13 | `.python-version` |
| MongoDB | 7 | `docker-compose.yml` |
| RabbitMQ | 3 | `docker-compose.yml` |
| Active UI | React 19, Vite 6 | `frontend-1/package.json` |

## Validate

Pull requests run Analytics tests, `frontend-1` lint and build, `python generate_reports.py --check`, `node --check app.js` for the five operational services, and the smoke helper tests. The commands are listed in [CONTRIBUTING.md](CONTRIBUTING.md).

The full order path is `cd microservices/smoke && npm run smoke` after the services are up. That run is also the Smoke workflow, started by hand or on Monday.

## What this tree includes

- IAM, Sales, Inventory, Warehouse, Logistics, and Analytics.
- HttpOnly refresh cookies, CSRF on refresh and logout, catalog order prices, and structured logs with `/health`, `/ready`, and `/metrics`.
- Offline forecast and anomaly evaluations, including the UCI Online Retail II rolling-origin run.
- `frontend-1` as the UI. `frontend/` remains only as the previous UI.

Status badges are not shown. Add them after the Validate and Smoke workflows have passed on the default branch. A license file is not included.
