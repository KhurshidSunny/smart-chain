import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const getInventorySummary = async () => {
    return await apiClient.get(`${API_URLS.INVENTORY}/inventory/summary`);
};

export const getProducts = async () => {
    return await apiClient.get(`${API_URLS.INVENTORY}/products`);
};

export const createProduct = async (productData) => {
    return await apiClient.post(`${API_URLS.INVENTORY}/products`, productData);
};

export const updateProduct = async (id, productData) => {
    return await apiClient.put(`${API_URLS.INVENTORY}/products/${id}`, productData);
};

export const deleteProduct = async (id) => {
    return await apiClient.delete(`${API_URLS.INVENTORY}/products/${id}`);
};

export const reserveInventory = async ({ productId, quantity }) => {
    return await apiClient.put(`${API_URLS.INVENTORY}/inventory/reserve`, { productId, quantity });
};