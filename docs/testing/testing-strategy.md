# Testing

Checks that exist in this repository:

| Check | Command | Where |
|---|---|---|
| Analytics unit tests | `npm test` | `microservices/analytics` |
| IAM session and rate-limit tests | `npm test` | `microservices/iam` |
| Sales pricing tests | `npm test` | `microservices/sales` |
| Smoke helper tests | `npm test` | `microservices/smoke` |
| Order and analytics smoke test | `npm run smoke` | `microservices/smoke`, with the six services already running |
| Active frontend | `npm run lint` and `npm run build` | `frontend-1` |
| Experiment reports | `python generate_reports.py --check` | `experiments` |
| Service syntax | `node --check app.js` | IAM, Sales, Inventory, Warehouse, Logistics |

`npm test` uses Node's built-in test runner (`node --test`). Inventory, Warehouse, and Logistics do not have a test script. The legacy `frontend/` folder still has a Jest script. That folder is not part of the checks above.

Pull requests run the Analytics tests, the `frontend-1` lint and build, the experiment report check, the service syntax check, and the smoke helper tests. The full order smoke test is the Smoke workflow. It can be started by hand, and it is also scheduled for Monday.

Runtime versions for those commands are Node 20 (`.nvmrc`) and Python 3.13 (`.python-version`). The container images use MongoDB 7 and RabbitMQ 3.

There is no Heroku or Amplify test environment in this repository. Run the services locally with `node scripts/local-stack.js start` or with the host setup in the root README.
