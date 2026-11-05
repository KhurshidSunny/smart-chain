# Order lifecycle and event contracts

How an order moves from Sales through Inventory, Warehouse, and Logistics, and which RabbitMQ messages exist today.

Exchange: topic exchange `smartchain_exchange` (`RABBITMQ_EXCHANGE`). Each service uses a durable queue named `{RABBITMQ_QUEUE_PREFIX}{service}_events`. The prefix defaults to `smart-chain-`.

Payloads are the `payload` object inside a version 1 event envelope. The envelope fields are `eventId`, `eventType`, `eventVersion`, `occurredAt`, `producer`, `correlationId`, `causationId`, and `payload`. `eventType` is the routing key. `eventVersion` is `1`. `correlationId` is the order id when the payload has `orderId`, otherwise the product id, otherwise `eventId`. `causationId` is the `eventId` of the message being handled, or `null` when the publish comes from an HTTP request.

`LowStockPredicted` is not part of this order flow. It is documented at the end.

## Success path

```mermaid
sequenceDiagram
  actor Customer
  participant Sales
  participant MQ as RabbitMQ
  participant Inventory
  participant Warehouse
  participant Logistics

  Customer->>Sales: POST / orders
  Sales->>Sales: save order status pending
  Sales->>MQ: sales.order.created
  MQ->>Inventory: sales.order.created
  alt Every line has enough stock
    Inventory->>Inventory: reserve stock
    Inventory->>MQ: inventory.reserved
    MQ->>Sales: inventory.reserved
    Sales->>Sales: status confirmed, store QR
    MQ->>Warehouse: inventory.reserved
    Warehouse->>Warehouse: picking list Pending
    Note over Warehouse: Completing the pick publishes warehouse.picking.completed. Nothing consumes it.
    Warehouse->>MQ: warehouse.order.packed
    par packed consumers
      MQ->>Sales: warehouse.order.packed
      Sales->>Sales: status packed
    and
      MQ->>Inventory: warehouse.order.packed
      Inventory->>Inventory: reservation fulfilled, sold transactions
    and
      MQ->>Logistics: warehouse.order.packed
      Logistics->>Logistics: shipment Created
      Logistics->>MQ: logistics.shipment.created
    end
    Note over Logistics: Dispatch publishes logistics.shipment.dispatched. Sales listens for logistics.shipment.shipping, which is not published, so status stays packed.
    Logistics->>MQ: logistics.shipment.delivered
    MQ->>Sales: logistics.shipment.delivered
    Sales->>Sales: status delivered
  else Broker is down when Sales publishes
    Sales->>Sales: order stays pending
    Note over Sales,MQ: Publish is skipped. The connection retries after 5 seconds. The skipped message is not stored for replay.
  end
```

A second stop, inside the consumer rather than at publish time: if any line has insufficient stock, Inventory logs the shortage and returns. It does not publish `inventory.reserved`. The `sales.order.created` delivery is still acknowledged, because the handler does not throw. The order remains `pending`.

Order status values in Sales are `pending`, `confirmed`, `packed`, `shipping`, `delivered`, and `cancelled`. The event path above sets `confirmed`, `packed`, and `delivered`. `shipping` is set only by a handler for `logistics.shipment.shipping`. No publisher uses that routing key. `PUT` order status can change the status in MongoDB without publishing an event.

## Acknowledgement and failure

All five consumers use manual acknowledgement (`noAck: false`) in their `subscribeToEvents` function:

| Outcome | What the consumer does |
|---|---|
| Handler promise resolves | `ack` |
| Handler promise rejects | `nack(msg, false, false)` — not requeued |
| Routing key has no handler on that queue | log, then `ack` |
| JSON is not an envelope, the version is not 1, `eventType` does not match the routing key, or the payload fails validation | log, then `nack(msg, false, false)` — not requeued |

Operational handlers catch their own errors and log them. A caught database error therefore resolves the promise and is acknowledged. It is not requeued.

`publishEvent` validates the payload, wraps it in a version 1 envelope, and sends a persistent JSON message on a confirm channel. The broker message properties include `messageId` (`eventId`) and `correlationId`. The call resolves `true` only after the broker confirms. If the broker rejects the publish, the call throws `Broker rejected <routing key>`. If `channel` is missing, the call logs a warning, returns `false`, and does not send the message. A closed connection schedules another connect after 5 seconds and, when handlers were already registered, subscribes again. That reconnect does not replay a publish that was skipped. HTTP routes that await `publishEvent` return 500 when a confirm fails. Consumer handlers still catch their own errors, so a failed follow-up publish is logged and the incoming message is acknowledged.

There is no dead-letter queue, retry exchange, or outbox.

## Operational catalog

Every row uses envelope version `1`. The business fields below are inside `payload`.

| Routing key | Producer | Consumer (queue) | Payload fields | Version |
|---|---|---|---|---|
| `sales.order.created` | Sales `publishOrderCreated` after `POST` create order | Inventory `handleOrderCreated` (`inventory_events`) | `orderId`, `customerId`, `items[]` of `{ productId, quantity, shippingAddress }` | 1 |
| `inventory.reserved` | Inventory `handleOrderCreated`, and `PUT /inventory/reserve` | Sales `handleInventoryReserved` (`sales_events`); Warehouse `handleInventoryReserved` (`warehouse_events`) | `orderId`, `reservationId`, `items` | 1 |
| `inventory.low_stock` | Inventory on create product, adjust, reserve, and `handleOrderCreated`, when `stockLevel <= reorderPoint` | none | `productId`, `currentLevel`, `reorderPoint` | 1 |
| `inventory.released` | Inventory `handleOrderCancelled` and `PUT /inventory/release` | none | `orderId`, `items` | 1 |
| `sales.order.cancelled` | none. Cancelling through the Sales status API updates MongoDB only | Inventory `handleOrderCancelled`; Warehouse `handleOrderCancelled` | handlers read `orderId` | 1 |
| `warehouse.picking.completed` | Warehouse when a picking list status is set to `Completed` | none | `pickingListId`, `orderId`, `pickedItems`, `completedBy` | 1 |
| `warehouse.order.packed` | Warehouse `POST /packages` | Sales `handleOrderPacked`; Inventory `handleOrderPacked`; Logistics `handleOrderPacked` | `orderId`, `packageId`, `qrCode`, `dimensions`, `shippingAddress` | 1 |
| `logistics.shipment.created` | Logistics `handleOrderPacked` after it saves the shipment | none | `shipmentId`, `orderId`, `packageId` | 1 |
| `logistics.shipemnt.created` | Logistics `POST /shipments`. The key is spelled this way in code | none | `shipmentId`, `orderId`, `packageId` | 1 |
| `logistics.shipment.dispatched` | Logistics dispatch, and status update when status is `Dispatched` | none | `shipmentId`, `orderId`, `dispatchDate`, `trackingNumber` | 1 |
| `logistics.shipment.shipping` | none | Sales `handleShipmentShipping` (`sales_events`) | handler reads `orderId` | 1 |
| `logistics.shipment.delivered` | Logistics deliver, and status update when status is `Delivered` | Sales `handleOrderDelivered` (`sales_events`) | `shipmentId`, `orderId`, `deliveryDate` | 1 |
| `TrackingUpdated` | Logistics `POST /tracking/:id/tracking-events` | none | `shipmentId`, `orderId`, `status`, `location` | 1 |

`items` on `inventory.reserved` is the `items` array from `sales.order.created`. Warehouse fills missing `sku`, `name`, `location`, and `shippingAddress` when it builds the picking list.

## Where the code lives

| Step | Path |
|---|---|
| Envelope build, validation, and confirm | `microservices/shared/events/` |
| Publish `sales.order.created` | `microservices/sales/controllers/events/eventHandlerController.js` (`publishOrderCreated`), called from `microservices/sales/controllers/orderController.js` |
| Sales bindings and handlers | `microservices/sales/app.js`, `microservices/sales/services/eventService.js` |
| Reserve, release, low stock, packed | `microservices/inventory/controllers/events/eventHandlerController.js`, `microservices/inventory/controllers/reservationController.js` |
| Inventory bindings | `microservices/inventory/app.js`, `microservices/inventory/services/eventService.js` |
| Picking list and `warehouse.picking.completed` | `microservices/warehouse/controllers/events/eventHandlerController.js`, `microservices/warehouse/controllers/pickingController.js` |
| `warehouse.order.packed` | `microservices/warehouse/controllers/packageController.js` |
| Shipment create, dispatch, deliver | `microservices/logistics/controllers/events/eventHandlerController.js`, `microservices/logistics/controllers/shipmentController.js`, `microservices/logistics/controllers/trackingController.js` |

The same ack rules are in `microservices/shared/events/delivery.js`, used by each service `services/eventService.js`.

## Advisory event: LowStockPredicted

`LowStockPredicted` is separate from `inventory.low_stock` and from the order flow.

| | |
|---|---|
| Routing key | `analytics.low_stock.predicted` |
| When | `GET /reorder` in Analytics, for each active product where `predictedDemand > stockLevel` |
| Producer | `microservices/analytics/services/lowStockPredictedService.js` |
| Consumer | Analytics only, on `smart-chain-analytics_events`. The handler logs the message. It does not create a purchase order or change stock |
| Payload | `event` (`"LowStockPredicted"`), `productId`, `sku`, `name`, `stockLevel`, `predictedDemand`, `horizonDays`, `forecastMethod`, `reorderPoint`, `suggestedQuantity`, `emittedAt` |
| Version | 1. Those fields are inside the envelope `payload`. `correlationId` is `productId` |

If RabbitMQ is not connected, reorder still returns JSON and the publish is skipped. Details of the forecast rule are in [analytics-technical-note.md](./analytics-technical-note.md).
