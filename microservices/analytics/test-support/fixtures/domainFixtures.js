function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

const ids = deepFreeze({
  customer: '64b000000000000000000001',
  rice: '64b000000000000000000101',
  cookingOil: '64b000000000000000000102',
  order: '64b000000000000000000201',
  user: '64b000000000000000000301',
});

const products = deepFreeze({
  rice: {
    _id: ids.rice,
    sku: 'RICE-1KG',
    name: 'Rice 1 kg',
    stockLevel: 24,
    reorderPoint: 10,
    unitCost: 3.5,
    active: true,
  },
  cookingOil: {
    _id: ids.cookingOil,
    sku: 'OIL-1L',
    name: 'Cooking oil 1 L',
    stockLevel: 8,
    reorderPoint: 12,
    unitCost: 4.25,
    active: true,
  },
});

const orders = deepFreeze([
  {
    _id: ids.order,
    orderNumber: 'ORD-2026-0001',
    customerId: ids.customer,
    status: 'confirmed',
    createdBy: ids.user,
    createdAt: '2026-01-04T10:30:00.000Z',
    items: [
      {
        productId: ids.rice,
        name: products.rice.name,
        quantity: 3,
        unitPrice: 5,
      },
      {
        productId: ids.cookingOil,
        name: products.cookingOil.name,
        quantity: 2,
        unitPrice: 6.5,
      },
    ],
    totalAmount: 28,
  },
]);

module.exports = {
  ids,
  orders,
  products,
};
