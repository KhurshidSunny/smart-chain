import { inventoryApiClient } from './apiClient';

export const getInventoryItems = async (params = {}) => {
  try {
    const response = await inventoryApiClient.get('/inventory', { params });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory items: ${error.response?.data?.message || error.message}`
    );
  }
};

export const getInventoryItem = async (id) => {
  try {
    const response = await inventoryApiClient.get(`/inventory/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const createInventoryItem = async (data) => {
  try {
    const response = await inventoryApiClient.post('/products', data);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to create inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const updateInventoryItem = async (id, data) => {
  try {
    const response = await inventoryApiClient.put(`/products/${id}`, data);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to update inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const deleteInventoryItem = async (id) => {
  try {
    const response = await inventoryApiClient.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to delete inventory item: ${error.response?.data?.message || error.message}`
    );
  }
};

export const reserveInventory = async ({ productId, quantity }) => {
  try {
    const response = await inventoryApiClient.put(`/inventory/reserve`, { productId, quantity });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to reserve inventory: ${error.response?.data?.message || error.message}`
    );
  }
};

export const releaseInventory = async ({ productId, quantity }) => {
  try {
    const response = await inventoryApiClient.put(`/inventory/release`, { productId, quantity });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to release inventory: ${error.response?.data?.message || error.message}`
    );
  }
};

export const adjustInventory = async ({ productId, quantity, reason }) => {
  try {
    const response = await inventoryApiClient.put(`/inventory/adjust`, { productId, quantity, reason });
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to adjust inventory: ${error.response?.data?.message || error.message}`
    );
  }
};

export const getInventoryTransactions = async () => {
  try {
    const response = await inventoryApiClient.get('/inventory/transactions');
    return response.data;
  } catch (error) {
    throw new Error(
      `Failed to fetch inventory transactions: ${error.response?.data?.message || error.message}`
    );
  }
};