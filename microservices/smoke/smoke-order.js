const fs = require('fs');
const path = require('path');
const {
  sumQuantities,
  sameId,
  findByOrderId,
  failureReport,
  exitCode,
  directMongoUri,
} = require('./report');

const ADDRESS = {
  street: '12 Smoke Road',
  city: 'Jalalabad',
  state: 'Nangarhar',
  zipCode: '26000',
  country: 'Afghanistan',
};
const QUANTITIES = [2, 2, 2, 8];
const BASES = {
  iam: process.env.SMOKE_IAM_URL || 'http://127.0.0.1:3001',
  sales: process.env.SMOKE_SALES_URL || 'http://127.0.0.1:3002',
  inventory: process.env.SMOKE_INVENTORY_URL || 'http://127.0.0.1:3003',
  warehouse: process.env.SMOKE_WAREHOUSE_URL || 'http://127.0.0.1:3004',
  logistics: process.env.SMOKE_LOGISTICS_URL || 'http://127.0.0.1:3005',
  analytics: process.env.SMOKE_ANALYTICS_URL || 'http://127.0.0.1:3006',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readEnvFile(file) {
  if (!fs.existsSync(file)) {
    return;
  }
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function loadLocalEnv() {
  readEnvFile(path.join(__dirname, '../sales/.env'));
  readEnvFile(path.join(__dirname, '../iam/.env'));
}

function mongoUri() {
  return process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smartchain?replicaSet=rs0';
}

function rabbitUrl() {
  return process.env.RABBITMQ_URL || 'amqp://guest:guest@127.0.0.1:5672';
}

function fail(step, detail, context) {
  const report = failureReport(step, detail, context);
  console.error(JSON.stringify(report, null, 2));
  process.exit(exitCode(report));
}

async function request(step, url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    fail(step, err.message, { url });
  }
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch (err) {
      body = { raw: text.slice(0, 300) };
    }
  }
  if (!response.ok) {
    fail(step, `HTTP ${response.status}`, { url, body });
  }
  return body;
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function poll(step, read, timeoutMs) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    last = await read();
    if (last && last.done) {
      return last.value;
    }
    await sleep(1000);
  }
  fail(step, last && last.detail ? last.detail : 'timed out', last && last.context);
}

async function login(email, password) {
  const body = await request('login', `${BASES.iam}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!body || !body.token) {
    fail('login', 'response did not include a token', { email });
  }
  return body.token;
}

async function waitReady() {
  const checks = [
    ['iam', `${BASES.iam}/ready`],
    ['sales', `${BASES.sales}/ready`],
    ['inventory', `${BASES.inventory}/ready`],
    ['warehouse', `${BASES.warehouse}/ready`],
    ['logistics', `${BASES.logistics}/ready`],
    ['analytics', `${BASES.analytics}/ready`],
  ];
  for (const [name, url] of checks) {
    let ready = false;
    let detail = 'no response';
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const response = await fetch(url);
        const body = await response.json();
        if (response.ok && body.status === 'ready') {
          ready = true;
          break;
        }
        detail = JSON.stringify(body.checks || body);
      } catch (err) {
        detail = err.message;
      }
      await sleep(1000);
    }
    if (!ready) {
      fail('readiness', `${name} is not ready`, { url, detail });
    }
  }
}

async function createProduct(adminToken, sku) {
  return request('create product', `${BASES.inventory}/products`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      sku,
      name: 'Smoke test product',
      unitCost: 10,
      stockLevel: 100,
      reorderPoint: 10,
    }),
  });
}

async function createOrder(customerToken, productId, quantity) {
  return request('create order', `${BASES.sales}/orders`, {
    method: 'POST',
    headers: authHeaders(customerToken),
    body: JSON.stringify({
      items: [{ productId, quantity }],
      shippingAddress: ADDRESS,
    }),
  });
}

async function orderStatus(token, orderId) {
  const order = await request('read order', `${BASES.sales}/orders/${orderId}`, {
    headers: authHeaders(token),
  });
  return order && order.status;
}

async function waitStatus(token, orderId, status) {
  return poll(`wait for ${status}`, async () => {
    const current = await orderStatus(token, orderId);
    if (current === status) {
      return { done: true, value: current };
    }
    return { done: false, detail: `status is ${current}`, context: { orderId, status: current } };
  }, 45000);
}

async function productStock(adminToken, productId) {
  const product = await request('read product', `${BASES.inventory}/products/${productId}`, {
    headers: authHeaders(adminToken),
  });
  return product.stockLevel;
}

async function completePicking(adminToken, orderId) {
  const list = await poll('wait for picking list', async () => {
    const body = await request('list picking lists', `${BASES.warehouse}/picking-lists?limit=100`, {
      headers: authHeaders(adminToken),
    });
    const row = findByOrderId(body && body.pickingLists, orderId);
    if (row) {
      return { done: true, value: row };
    }
    return { done: false, detail: 'picking list was not created', context: { orderId } };
  }, 45000);
  await request('complete picking', `${BASES.warehouse}/picking-lists/${list._id}/status`, {
    method: 'PUT',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ status: 'Completed' }),
  });
  return list;
}

async function packOrder(adminToken, orderId) {
  return request('create package', `${BASES.warehouse}/packages`, {
    method: 'POST',
    headers: authHeaders(adminToken),
    body: JSON.stringify({
      orderId,
      packagingType: 'box',
      dimensions: { width: 10, height: 10, depth: 10, weight: 1 },
      packedBy: 'smoke',
      shippingAddress: ADDRESS,
    }),
  });
}

async function waitShipment(adminToken, orderId) {
  return poll('wait for shipment', async () => {
    const rows = await request('list shipments', `${BASES.logistics}/shipments`, {
      headers: authHeaders(adminToken),
    });
    const row = Array.isArray(rows) ? rows.find((item) => sameId(item.orderId, orderId)) : null;
    if (row) {
      return { done: true, value: row };
    }
    return { done: false, detail: 'shipment was not created', context: { orderId } };
  }, 45000);
}

async function moveShipment(adminToken, shipmentId, status) {
  return request(`shipment ${status}`, `${BASES.logistics}/shipments/${shipmentId}/status`, {
    method: 'PUT',
    headers: authHeaders(adminToken),
    body: JSON.stringify({ status }),
  });
}

async function republishCreated(orderId) {
  const mongoose = require('mongoose');
  const amqp = require('amqplib');
  await mongoose.connect(directMongoUri(mongoUri()));
  try {
    const row = await mongoose.connection.db.collection('outboxevents').findOne({
      routingKey: 'sales.order.created',
      'envelope.correlationId': String(orderId),
    });
    if (!row || !row.envelope) {
      fail('duplicate event', 'stored sales.order.created envelope was not found', { orderId });
    }
    const connection = await amqp.connect(rabbitUrl());
    try {
      const channel = await connection.createConfirmChannel();
      const exchange = process.env.RABBITMQ_EXCHANGE || 'smartchain_exchange';
      await new Promise((resolve, reject) => {
        channel.publish(
          exchange,
          'sales.order.created',
          Buffer.from(JSON.stringify(row.envelope)),
          {
            persistent: true,
            contentType: 'application/json',
            messageId: row.envelope.eventId,
            correlationId: row.envelope.correlationId,
          },
          (err) => (err ? reject(err) : resolve())
        );
      });
    } finally {
      await connection.close();
    }
    return row.envelope.eventId;
  } finally {
    await mongoose.disconnect();
  }
}

async function outboxCount() {
  const mongoose = require('mongoose');
  await mongoose.connect(directMongoUri(mongoUri()));
  try {
    return mongoose.connection.db.collection('outboxevents').countDocuments();
  } finally {
    await mongoose.disconnect();
  }
}

async function main() {
  loadLocalEnv();
  const runId = process.env.SMOKE_RUN_ID || String(Date.now());
  const sku = `SMK-${runId}`;
  const adminEmail = process.env.SMOKE_ADMIN_EMAIL || 'admin@smartchain.local';
  const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'Admin123!';

  await waitReady();
  const adminToken = await login(adminEmail, adminPassword);
  const customer = await request('register customer', `${BASES.iam}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `smoke.${runId}@smartchain.test`,
      password: 'Smoke1234',
      firstName: 'Smoke',
      lastName: 'Customer',
    }),
  });
  const customerToken = customer.token;
  const product = await createProduct(adminToken, sku);
  const productId = String(product._id);

  const orders = [];
  for (const quantity of QUANTITIES) {
    const order = await createOrder(customerToken, productId, quantity);
    orders.push(order);
    await waitStatus(customerToken, order._id, 'confirmed');
  }

  const traced = orders[0];
  const stockBefore = await productStock(adminToken, productId);
  await republishCreated(traced._id);
  await sleep(5000);
  const stockAfter = await productStock(adminToken, productId);
  if (stockBefore !== stockAfter) {
    fail('duplicate event', 'republishing the same order event changed stock', {
      orderId: String(traced._id),
      stockBefore,
      stockAfter,
    });
  }
  if (stockAfter !== 100 - QUANTITIES.reduce((sum, value) => sum + value, 0)) {
    fail('reservation', 'stock does not match the reserved quantities', {
      productId,
      stockAfter,
    });
  }

  await completePicking(adminToken, traced._id);
  await packOrder(adminToken, traced._id);
  await waitStatus(customerToken, traced._id, 'packed');
  const shipment = await waitShipment(adminToken, traced._id);
  await moveShipment(adminToken, shipment._id, 'Dispatched');
  await moveShipment(adminToken, shipment._id, 'Delivered');
  await waitStatus(customerToken, traced._id, 'delivered');

  const demand = await request('demand history', `${BASES.analytics}/demand/${productId}`, {
    headers: authHeaders(adminToken),
  });
  const sold = sumQuantities(demand.data);
  const expected = QUANTITIES.reduce((sum, value) => sum + value, 0);
  if (sold !== expected) {
    fail('demand history', `expected ${expected} units and found ${sold}`, { productId });
  }

  const forecast = await request('forecast', `${BASES.analytics}/forecast/${productId}`, {
    headers: authHeaders(adminToken),
  });
  if (!forecast.data || typeof forecast.data.predictedDemand !== 'number') {
    fail('forecast', 'predictedDemand was not a number', { productId });
  }
  await request('forecast compare', `${BASES.analytics}/forecast/${productId}/compare`, {
    headers: authHeaders(adminToken),
  });
  const anomalies = await request('anomalies', `${BASES.analytics}/anomalies?limit=50`, {
    headers: authHeaders(adminToken),
  });
  if (!Array.isArray(anomalies.data)) {
    fail('anomalies', 'response did not include a data array', {});
  }

  const before = await outboxCount();
  const reorder = await request('reorder', `${BASES.analytics}/reorder`, {
    headers: authHeaders(adminToken),
  });
  const after = await outboxCount();
  if (!Array.isArray(reorder.data) || after !== before) {
    fail('reorder', 'GET /reorder wrote an outbox event or returned an unexpected body', {
      before,
      after,
    });
  }

  const report = {
    ok: true,
    runId,
    sku,
    productId,
    orderId: String(traced._id),
    shipmentId: String(shipment._id),
    stockAfter,
    demandUnits: sold,
    reorderCount: reorder.count,
  };
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) {
  main().catch((err) => fail('smoke', err.message, {}));
}

module.exports = { QUANTITIES, ADDRESS };
