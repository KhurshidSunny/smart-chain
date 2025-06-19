import { salesApiClient } from './apiClient'; // Reuse inventoryApiClient or create orderApiClient

// Order APIs
export const getOrders = async (params = {}) => {
  try {
    const response = await salesApiClient.get('/api/orders', params);
    console.log(response.data)
    return response.data; // { orders: [], total: number }
  } catch (error) {
    throw new Error(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
  }
};

export const getOrderById = async (id) => {
  try {
    const response = await salesApiClient.get(`/api/orders/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch order: ${error.response?.data?.message || error.message}`);
  }
};

export const createOrder = async (orderData) => {
  try {
    const response = await salesApiClient.post('/api/orders', orderData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create order: ${error.response?.data?.message || error.message}`);
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const response = await salesApiClient.put(`/api/orders/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to update order status: ${error.response?.data?.message || error.message}`);
  }
};

// Mocked APIs (not implemented yet)
export const updateOrder = async (id, orderData) => {
  console.warn(`PUT /api/orders/${id} not implemented, mocking response`);
  return { id, ...orderData }; // Mock response
};

export const deleteOrder = async (id) => {
  console.warn(`DELETE /api/orders/${id} not implemented, mocking response`);
  return { id, status: 'cancelled' }; // Mock response
};

export const getOrderHistory = async (id) => {
  console.warn(`GET /api/orders/${id}/history not implemented, mocking response`);
  return [
    { id: '1', event: 'Order Placed', date: '2025-03-15 10:00', details: 'Order received' },
    { id: '2', event: 'In Progress', date: '2025-03-15 12:00', details: 'Order being processed' },
  ]; // Mock history
};

// Customer APIs (assumed endpoints)
export const getCustomers = async () => {
  try {
    const response = await salesApiClient.get('/api/customers');
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch customers: ${error.response?.data?.message || error.message}`);
  }
};

export const createCustomer = async (customerData) => {
  try {
    const response = await salesApiClient.post('/api/customers', customerData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create customer: ${error.response?.data?.message || error.message}`);
  }
};

export const getCustomerAddresses = async (customerId) => {
  try {
    const response = await salesApiClient.get(`/api/customers/${customerId}/addresses`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch addresses: ${error.response?.data?.message || error.message}`);
  }
};

export const createAddress = async (customerId, addressData) => {
  try {
    const response = await salesApiClient.post(`/api/customers/${customerId}/addresses`, addressData);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create address: ${error.response?.data?.message || error.message}`);
  }
};

// Inventory APIs (from inventoryService.js)
export const getInventoryItems = async (params = {}) => {
  try {
    const response = await salesApiClient.get('/inventory', { params });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch inventory items: ${error.response?.data?.message || error.message}`);
  }
};

export const reserveInventory = async (orderId, items) => {
  try {
    const response = await salesApiClient.put('/inventory/reserve', { orderId, items });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to reserve inventory: ${error.response?.data?.message || error.message}`);
  }
};

export const releaseInventory = async (orderId) => {
  try {
    const response = await salesApiClient.put('/inventory/release', { orderId });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to release inventory: ${error.response?.data?.message || error.message}`);
  }
};