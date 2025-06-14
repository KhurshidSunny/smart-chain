import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const getPickingLists = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return await apiClient.get(`${API_URLS.WAREHOUSE}/picking-lists?${params.toString()}`);
};

export const getPickingList = async (id) => {
    return await apiClient.get(`${API_URLS.WAREHOUSE}/picking-lists/${id}`);
};

export const assignPickingList = async (id, data) => {
    return await apiClient.put(`${API_URLS.WAREHOUSE}/picking-lists/${id}/assign`, data);
};

export const updatePickedItem = async (pickingListId, itemId, data) => {
    return await apiClient.put(`${API_URLS.WAREHOUSE}/picking-lists/${pickingListId}/items/${itemId}`, data);
};

export const createPackage = async (packageData) => {
    return await apiClient.post(`${API_URLS.WAREHOUSE}/packages`, packageData);
};