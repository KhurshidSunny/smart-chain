# Logistics Microservice

## Overview

The Logistics microservice is a core component of the Order Processing and QR Code Tracking system. It manages shipment creation, tracking, and delivery confirmation, integrating with other microservices (e.g., Sales, Warehouse, IAM) via RabbitMQ events and RESTful APIs. Built with Node.js, Express, and MongoDB, it supports role-based access control (RBAC) using JWT authentication and event-driven communication for real-time updates.

Key features:
- Create and manage shipments with unique tracking numbers and QR codes.
- Track shipment status changes (Created, Dispatched, InTransit, OutForDelivery, Delivered, Failed).
- Handle RabbitMQ events (`OrderPacked`, `QRCodeScanned`) and publish events (`ShipmentCreated`, `ShipmentDispatched`, `TrackingUpdated`, `OrderDelivered`).
- Provide public tracking via tracking number without authentication.

## Prerequisites

- **Node.js**: v16 or higher
- **MongoDB**: v4.4 or higher
- **RabbitMQ**: v3.8 or higher
- **Postman**: For testing APIs
- **Git**: For cloning the repository

## Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd microservices/logistics
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env` file in the `microservices/logistics` directory with the following variables:
   ```
   MONGO_URI=mongodb://<your-mongo-uri>

   RABBITMQ_URL=amqp://<your-rabbitmq-url>
   RABBITMQ_EXCHANGE=  # Optional, defaults to 'smartchain_exchange'
   RABBITMQ_QUEUE_PREFIX=<queue prefix (smart-chain-)>

   JWT_SECRET=<your-jwt-secret>

   PORT=3005
   ```
   - `MONGO_URI`: MongoDB connection string.

   - `RABBITMQ_URL`: RabbitMQ connection string.
   - `RABBITMQ_EXCHANGE`:  Optional, defaults to 'smartchain_exchange'
   - `RABBITMQ_QUEUE_PREFIX`: < queue prefix (smart-chain-)>

   - `JWT_SECRET`: Secret key for JWT verification.
   
   - `PORT`: Port for the microservice (default: 3005).
   

4. **Run the Microservice**:
   - Development mode (with nodemon):
     ```bash
     npm run dev
     ```
   - Production mode:
     ```bash
     npm start
     ```

## API Endpoints

The Logistics microservice exposes the following RESTful API endpoints. All endpoints except `/tracking/number/:trackingNumber` require JWT authentication via the `Authorization: Bearer <token>` header.

### Shipment Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| POST | `/shipments` | `logistics_manager`, `admin` | Create a new shipment with tracking number and QR code. |
| GET | `/shipments` | `system_admin`, `warehouse_manager`, `sales_manager`, `logistics_manager`, `customer_service` | List all shipments. |
| GET | `/shipments/:id` | `system_admin`, `warehouse_manager`, `sales_manager`, `logistics_manager`, `customer_service` | Get shipment details by ID. |
| PUT | `/shipments/:id/status` | `logistics_manager`, `admin` | Update shipment status (e.g., `InTransit`, `Delivered`). |
| PUT | `/shipments/:id/dispatch` | `logistics_manager`, `admin` | Mark shipment as `Dispatched`. |
| PUT | `/shipments/:id/deliver` | `logistics_manager`, `admin`, `customer_service`, `customer` | Mark shipment as `Delivered`. |

### Tracking Endpoints

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/shipments/:id/tracking` | `system_admin`, `warehouse_manager`, `sales_manager`, `logistics_manager`, `customer_service`, `customer` | Get tracking events for a shipment. |
| POST | `/shipments/:id/tracking-events` | `logistics_manager`, `admin` | Create a new tracking event. |
| GET | `/tracking/number/:trackingNumber` | None (public) | Track shipment by tracking number, including shipment details and tracking events. |

### Example Request

**POST /shipments**
```json
{
  "orderId": "507f1f77bcf86cd799439011",
  "packageId": "507f191e810c19729de860ea",
  "carrier": "DefaultCarrier",
  "serviceLevel": "Standard",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "notes": "Test shipment"
}
```

**Response** (201 Created):
```json
{
  "_id": "608f1f77bcf86cd799439012",
  "orderId": "507f1f77bcf86cd799439011",
  "packageId": "507f191e810c19729de860ea",
  "trackingNumber": "TRK-1697051234567-507f1f77bcf86cd799439011",
  "qrCode": "QR-TRK-1697051234567-507f1f77bcf86cd799439011",
  "status": "Created",
  "carrier": "DefaultCarrier",
  "serviceLevel": "Standard",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "createdAt": "2023-10-11T12:34:56.789Z",
  "updatedAt": "2023-10-11T12:34:56.789Z"
}
```

## Event Handling

The Logistics microservice uses RabbitMQ for event-driven communication, subscribing to and publishing events on the `logistics_events` topic exchange.

### Subscribed Events

| Event | Description | Action |
|-------|-------------|--------|
| `OrderPacked` | Triggered when an order is packed in the Warehouse. | Creates a new shipment with a tracking number and QR code, publishes `ShipmentCreated`. |
| `QRCodeScanned` | Triggered when a shipment QR code is scanned. | Updates shipment status (e.g., `InTransit`, `OutForDelivery`), creates a tracking event, publishes `TrackingUpdated`. |

### Published Events

| Event | Description | Payload |
|-------|-------------|---------|
| `ShipmentCreated` | Shipment created successfully. | `{ shipmentId, orderId, packageId }` |
| `ShipmentDispatched` | Shipment marked as dispatched. | `{ shipmentId, orderId, dispatchDate, trackingNumber }` |
| `TrackingUpdated` | Tracking event created or status updated. | `{ shipmentId, orderId, status, location }` |
| `OrderDelivered` | Shipment marked as delivered. | `{ shipmentId, orderId, deliveryDate }` |

## Directory Structure

```
microservices/logistics/
├── controllers/
│   ├── events/
│   │   └── eventHandlerController.js   # Event handlers for RabbitMQ
│   ├── shipmentController.js           # Shipment API logic
│   └── trackingController.js           # Tracking API logic
├── middleware/
│   ├── authMiddleware.js               # JWT authentication
│   └── validate.js                     # Joi validation
├── models/
│   ├── shipmentModel.js                # Shipment Mongoose schema
│   └── trackingEventModel.js           # Tracking event Mongoose schema
├── routes/
│   ├── shipmentRoutes.js               # Shipment API routes
│   └── trackingRoutes.js               # Tracking API routes
├── services/
│   └── eventService.js                 # RabbitMQ event handling
├── config/
│   └── db.js                           # MongoDB connection
├── .env                                # Environment variables
├── app.js                              # Express app setup
├── package.json                        # Dependencies and scripts
├── postman_test.json                   # Postman collection for testing
└── README.md                           # This file
```

## Testing

A Postman collection (`postman_test.json`) is provided to test all API endpoints, covering success and error scenarios (e.g., invalid tokens, missing fields, RBAC).

### Setup

1. **Import the Collection**:
   - In Postman, import `postman_test.json` via **File > Import**.
   - The collection is named "Logistics Microservice API Tests".

2. **Configure Environment Variables**:
   - Create a Postman environment with:
     - `LOGISTICS_SERVICE_URL`: Microservice URL (e.g., `http://localhost:3005`).
     - `JWT_TOKEN`: Valid JWT token for the current user (generate via IAM service `/auth/login`).
     - `ORDER_ID`: Valid MongoDB ObjectId for an order (from Sales service).
     - `PACKAGE_ID`: Valid MongoDB ObjectId for a package (from Warehouse service).
     - `SHIPMENT_ID`: Initially empty; populated by `POST /shipments`.
     - `TRACKING_NUMBER`: Initially empty; populated by `POST /shipments`.

3. **Run Tests**:
   - Select the environment in Postman.
   - Run the collection via **Collection Runner** or test requests individually.
   - Ensure `JWT_TOKEN` has the correct role for each test (e.g., `admin` for `POST /shipments`, `customer` for `PUT /shipments/:id/deliver`).



## Dependencies

Listed in `package.json`:
- **Runtime**: `express`, `mongoose`, `jsonwebtoken`, `joi`, `amqplib`, `cors`, `helmet`, `morgan`, `qrcode`, `dotenv`.
- **Development**: `nodemon`.

Install with:
```bash
npm install
```

## License

This project is licensed under the MIT License.