# Logistics

Port 3005. Creates a shipment when it consumes `warehouse.order.packed`, then publishes `logistics.shipment.created`. Dispatch and delivery are HTTP updates. `Dispatched` publishes `logistics.shipment.dispatched`. `Delivered` publishes `logistics.shipment.delivered`.

Setup, ports, and demo accounts are in the [root README](../../README.md). Event fields are in [docs/order-lifecycle.md](../../docs/order-lifecycle.md).

`GET /tracking/number/:trackingNumber` does not require a token. Other shipment routes require a Bearer access token and one of the roles named on that route.

Copy `.env.example` to `.env`. `JWT_SECRET` must match IAM. Order writes need a MongoDB replica set.
