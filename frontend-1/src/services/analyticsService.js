import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const getProductDemandHistory = async (productId, params = {}) => {
    return await apiClient.get(`${API_URLS.ANALYTICS}/demand/${productId}`, { params });
};

export const getProductForecast = async (productId, params = {}) => {
    return await apiClient.get(`${API_URLS.ANALYTICS}/forecast/${productId}`, { params });
};

export const getReorderSuggestions = async (params = {}) => {
    return await apiClient.get(`${API_URLS.ANALYTICS}/reorder`, { params });
};

export const getOrderAnomalies = async (params = {}) => {
    return await apiClient.get(`${API_URLS.ANALYTICS}/anomalies`, { params });
};
