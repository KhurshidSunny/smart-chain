import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const getProducts = async () => {
    return await apiClient.get(`${API_URLS.INVENTORY}/products`);
};

export const reserveInventory = async ({ productId, quantity }) => {
    return await apiClient.put(`${API_URLS.INVENTORY}/inventory/reserve`, { productId, quantity });
};

export const createOrder = async (orderData) => {
    return await apiClient.post(`${API_URLS.SALES}/orders`, orderData);
};

export const getOrders = async () => {
    return await apiClient.get(`${API_URLS.SALES}/orders`);
};

export const getOrder = async (id) => {
    return await apiClient.get(`${API_URLS.SALES}/orders/${id}`);
};