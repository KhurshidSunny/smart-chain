import axios from 'axios';
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
    const response = await axios.get(
        `${API_URLS.LOGISTICS}/tracking/number/${encodeURIComponent(trackingNumber.trim())}`,
        { timeout: 10000 }
    );
    const body = response.data || {};
    const shipment = body.shipment || body;
    return {
        ...response,
        data: {
            ...shipment,
            shipmentId: shipment._id || body.shipmentId,
            trackingEvents: body.trackingEvents || shipment.trackingEvents || [],
        },
    };
};

export const confirmDelivery = async (shipmentId) => {
    return await apiClient.post(`${API_URLS.LOGISTICS}/shipments/${shipmentId}/deliver`);
};

export const getTrackingEvents = async (shipmentId) => {
    return await apiClient.get(`${API_URLS.LOGISTICS}/shipments/${shipmentId}/tracking-events`);
};