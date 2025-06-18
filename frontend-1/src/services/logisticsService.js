import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const getShipments = async (filters = {}) => {
    const params = new URLSearchParams(filters);
    return await apiClient.get(`${API_URLS.LOGISTICS}/shipments?${params.toString()}`);
};

export const getShipment = async (id) => {
    return await apiClient.get(`${API_URLS.LOGISTICS}/shipments/${id}`);
};

export const updateShipmentStatus = async (id, data) => {
    return await apiClient.put(`${API_URLS.LOGISTICS}/shipments/${id}/status`, data);
};

export const scanDispatch = async (id) => {
    return await apiClient.post(`${API_URLS.LOGISTICS}/shipments/${id}/scan-dispatch`);
};

export const getTrackingInfo = async (trackingNumber) => {
    return await apiClient.get(`${API_URLS.LOGISTICS}/tracking/${trackingNumber}`);
};

export const confirmDelivery = async (shipmentId) => {
    return await apiClient.post(`${API_URLS.LOGISTICS}/shipments/${shipmentId}/deliver`);
};

export const getTrackingEvents = async (shipmentId) => {
    return await apiClient.get(`${API_URLS.LOGISTICS}/shipments/${shipmentId}/tracking-events`);
};