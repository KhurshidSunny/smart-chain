const test = require('node:test');
const assert = require('node:assert/strict');
const { priceOrder, OrderPricingError } = require('../services/orderPricing');

const productId = '64b000000000000000000001';

function catalog(overrides = {}) {
  return new Map([
    [productId, {
      name: 'Handheld QR Scanner X2',
      unitCost: 65,
      stockLevel: 10,
      active: true,
      ...overrides,
    }],
  ]);
}

function requestItem(overrides = {}) {
  return {
    productId,
    name: 'Fake name',
    quantity: 2,
    unitPrice: 0.01,
    ...overrides,
  };
}

test('a tampered client price does not change the order total', () => {
  const priced = priceOrder(
    [requestItem({ unitPrice: 0.01, quantity: 2 })],
    catalog({ unitCost: 65 })
  );

  assert.equal(priced.items[0].unitPrice, 65);
  assert.equal(priced.items[0].name, 'Handheld QR Scanner X2');
  assert.equal(priced.totalAmount, 130);
});

test('client total fields are not an input to pricing', () => {
  const priced = priceOrder(
    [{ ...requestItem({ quantity: 3 }), totalAmount: 1, subtotal: 1 }],
    catalog({ unitCost: 1.25 })
  );

  assert.equal(priced.items[0].unitPrice, 1.25);
  assert.equal(priced.totalAmount, 3.75);
});

test('a later catalog price does not rewrite an existing snapshot', () => {
  const products = catalog({ unitCost: 10 });
  const first = priceOrder([requestItem({ quantity: 1 })], products);

  products.get(productId).unitCost = 12;
  const second = priceOrder([requestItem({ quantity: 1 })], products);

  assert.equal(first.items[0].unitPrice, 10);
  assert.equal(first.totalAmount, 10);
  assert.equal(second.items[0].unitPrice, 12);
  assert.equal(second.totalAmount, 12);
});

test('unknown, inactive, and over-stock requests are rejected', () => {
  assert.throws(
    () => priceOrder([requestItem({ productId: '64b000000000000000000099' })], catalog()),
    (error) => error instanceof OrderPricingError && error.message === 'Unknown product'
  );
  assert.throws(
    () => priceOrder([requestItem()], catalog({ active: false })),
    (error) => error instanceof OrderPricingError && /not available/.test(error.message)
  );
  assert.throws(
    () => priceOrder([requestItem({ quantity: 11 })], catalog({ stockLevel: 10 })),
    (error) => error instanceof OrderPricingError && error.message === 'Only 10 units available for Handheld QR Scanner X2'
  );
});

test('invalid quantities are rejected before a total is produced', () => {
  for (const quantity of [0, -1, 1.5, 'two']) {
    assert.throws(
      () => priceOrder([requestItem({ quantity })], catalog()),
      OrderPricingError
    );
  }
});

test('duplicate lines for one product are priced as one quantity', () => {
  const priced = priceOrder(
    [requestItem({ quantity: 2, unitPrice: 1 }), requestItem({ quantity: 3, unitPrice: 9 })],
    catalog({ unitCost: 40, stockLevel: 5 })
  );

  assert.equal(priced.items.length, 1);
  assert.equal(priced.items[0].quantity, 5);
  assert.equal(priced.totalAmount, 200);
});
