import apiClient from './apiClient';

export const getInventoryItems = async (params = {}) => {
  try {
    const response = await apiClient.get('/products', { params });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory items: ${error.response?.data?.message || error.message}`
    );
  }
};

export const createInventoryItem = async (data) => {
  try {
    const response = await apiClient.post('/products', data);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to create inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const updateInventoryItem = async (id, data) => {
  try {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to update inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const deleteInventoryItem = async (id) => {
  try {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to delete inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const reserveInventory = async ({ productId, quantity }) => {
  try {
    const response = await apiClient.put(`/inventory/reserve`, { productId, quantity });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to reserve inventory: ${error.response?.data?.message || error.message}`
    );
  }
};

export const releaseInventory = async ({ productId, quantity }) => {
  try {
    const response = await apiClient.put(`/inventory/release`, { productId, quantity });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to release inventory: ${error.response?.data?.message || error.message}`
    );
  }
};

export const adjustInventory = async ({ productId, quantity, reason }) => {
  try {
    const response = await apiClient.put(`/inventory/adjust`, { productId, quantity, reason });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to adjust inventory: ${error.response?.data?.message || error.message}`
    );
  }
};

export const getInventoryTransactions = async () => {
  try {
    const response = await apiClient.get('/inventory/transactions');
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory transactions: ${error.response?.data?.message || error.message}`
    );
  }
};

export const getStockSummary = async () => {
  try {
    const response = await apiClient.get('/inventory/summary');
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch stock summary: ${error.response?.data?.message || error.message}`
    );
  }
};

export const getLowStockProducts = async () => {
  try {
    const response = await apiClient.get('/products', { params: { stock: 'lte:20' } });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch low stock products: ${error.response?.data?.message || error.message}`
    );
  }
};

export const setLowStockThresholds = async (thresholds) => {
  try {
    const response = await apiClient.put('/inventory/thresholds', thresholds);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to set low stock thresholds: ${error.response?.data?.message || error.message}`
    );
  }
};