const { randomUUID } = require('crypto');

const EVENT_VERSION = 1;

const PAYLOAD_RULES = {
  'sales.order.created': { required: ['orderId', 'customerId'], arrays: ['items'] },
  'sales.order.cancelled': { required: ['orderId'] },
  'inventory.reserved': { required: ['orderId', 'reservationId'], arrays: ['items'] },
  'inventory.low_stock': { required: ['productId', 'currentLevel', 'reorderPoint'] },
  'inventory.released': { required: ['orderId'], arrays: ['items'] },
  'warehouse.picking.completed': {
    required: ['pickingListId', 'orderId', 'completedBy'],
    arrays: ['pickedItems'],
  },
  'warehouse.order.packed': { required: ['orderId', 'packageId'] },
  'logistics.shipment.created': { required: ['shipmentId', 'orderId', 'packageId'] },
  'logistics.shipemnt.created': { required: ['shipmentId', 'orderId', 'packageId'] },
  'logistics.shipment.dispatched': {
    required: ['shipmentId', 'orderId', 'dispatchDate', 'trackingNumber'],
  },
  'logistics.shipment.shipping': { required: ['orderId'] },
  'logistics.shipment.delivered': { required: ['shipmentId', 'orderId', 'deliveryDate'] },
  TrackingUpdated: { required: ['shipmentId', 'orderId', 'status', 'location'] },
  'analytics.low_stock.predicted': {
    required: ['event', 'productId', 'stockLevel', 'predictedDemand', 'emittedAt'],
  },
};

function missing(value) {
  return value === undefined || value === null || value === '';
}

function validatePayload(eventType, payload) {
  const rules = PAYLOAD_RULES[eventType];
  if (!rules) {
    return `unknown event type ${eventType}`;
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return 'payload must be an object';
  }
  for (const field of rules.required) {
    if (missing(payload[field])) {
      return `payload.${field} is required`;
    }
  }
  for (const field of rules.arrays || []) {
    if (!Array.isArray(payload[field])) {
      return `payload.${field} must be an array`;
    }
  }
  if (eventType === 'analytics.low_stock.predicted' && payload.event !== 'LowStockPredicted') {
    return 'payload.event must be LowStockPredicted';
  }
  return null;
}

function defaultCorrelationId(payload, eventId) {
  if (!missing(payload.orderId)) {
    return String(payload.orderId);
  }
  if (!missing(payload.productId)) {
    return String(payload.productId);
  }
  return eventId;
}

function buildEnvelope({
  eventType,
  producer,
  payload,
  correlationId,
  causationId,
  occurredAt,
  eventId,
}) {
  if (missing(eventType)) {
    throw new Error('eventType is required');
  }
  if (missing(producer)) {
    throw new Error('producer is required');
  }
  const payloadError = validatePayload(eventType, payload);
  if (payloadError) {
    throw new Error(payloadError);
  }

  const id = missing(eventId) ? randomUUID() : String(eventId);
  const when = occurredAt || new Date().toISOString();
  if (Number.isNaN(Date.parse(when))) {
    throw new Error('occurredAt must be an ISO timestamp');
  }

  return {
    eventId: id,
    eventType,
    eventVersion: EVENT_VERSION,
    occurredAt: when,
    producer: String(producer),
    correlationId: missing(correlationId) ? defaultCorrelationId(payload, id) : String(correlationId),
    causationId: missing(causationId) ? null : String(causationId),
    payload,
  };
}

function parseEnvelope(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, reason: 'envelope must be an object' };
  }
  for (const field of ['eventId', 'eventType', 'occurredAt', 'producer', 'correlationId']) {
    if (typeof body[field] !== 'string' || body[field].length === 0) {
      return { ok: false, reason: `${field} is required` };
    }
  }
  if (body.eventVersion !== EVENT_VERSION) {
    return { ok: false, reason: 'unsupported event version' };
  }
  if (body.causationId !== null && typeof body.causationId !== 'string') {
    return { ok: false, reason: 'causationId must be a string or null' };
  }
  if (Number.isNaN(Date.parse(body.occurredAt))) {
    return { ok: false, reason: 'occurredAt must be an ISO timestamp' };
  }
  const payloadError = validatePayload(body.eventType, body.payload);
  if (payloadError) {
    return { ok: false, reason: payloadError };
  }
  return { ok: true, envelope: body };
}

function followFrom(envelope) {
  if (!envelope || missing(envelope.eventId)) {
    return {};
  }
  return {
    correlationId: envelope.correlationId,
    causationId: envelope.eventId,
  };
}

module.exports = {
  EVENT_VERSION,
  PAYLOAD_RULES,
  validatePayload,
  buildEnvelope,
  parseEnvelope,
  followFrom,
};
