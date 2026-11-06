const MAX_LINE_QUANTITY = 10000;

class OrderPricingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'OrderPricingError';
    this.status = 400;
  }
}

function priceOrder(items, productsById) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderPricingError('At least one item is required');
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = item && item.productId ? String(item.productId) : '';
    if (!/^[a-fA-F0-9]{24}$/.test(productId)) {
      throw new OrderPricingError('Invalid product ID');
    }
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new OrderPricingError('Quantity must be a whole number of at least 1');
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const lines = [];
  let totalCents = 0;

  for (const [productId, quantity] of quantities) {
    if (quantity > MAX_LINE_QUANTITY) {
      throw new OrderPricingError('Quantity is too large');
    }

    const product = productsById.get(productId);
    if (!product) {
      throw new OrderPricingError('Unknown product');
    }
    if (product.active === false) {
      throw new OrderPricingError(`${product.name || 'Product'} is not available for order`);
    }

    const stockLevel = Number(product.stockLevel);
    if (!Number.isFinite(stockLevel) || stockLevel < quantity) {
      const available = Number.isFinite(stockLevel) && stockLevel > 0 ? Math.floor(stockLevel) : 0;
      throw new OrderPricingError(`Only ${available} units available for ${product.name || 'this product'}`);
    }

    const unitCost = Number(product.unitCost);
    if (!Number.isFinite(unitCost) || unitCost < 0 || !product.name) {
      throw new OrderPricingError('Product price is not available');
    }

    const unitCents = Math.round(unitCost * 100);
    totalCents += unitCents * quantity;
    lines.push({
      productId,
      name: product.name,
      quantity,
      unitPrice: unitCents / 100,
    });
  }

  return {
    items: lines,
    totalAmount: totalCents / 100,
  };
}

module.exports = {
  OrderPricingError,
  priceOrder,
  MAX_LINE_QUANTITY,
};
