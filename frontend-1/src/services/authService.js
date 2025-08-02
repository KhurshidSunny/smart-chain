// src/services/authService.js
import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const login = async ({ email, password }) => {
    const response = await apiClient.post(`${API_URLS.IAM}/auth/login`, {
        email,
        password,
    });
    return response.data;
};

export const register = async (userData) => {
    const response = await apiClient.post(`${API_URLS.IAM}/auth/register`, userData);
    return response.data;
};

export const logout = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    const response = await apiClient.post(`${API_URLS.IAM}/auth/logout`, {
        refreshToken
    });
    return response.data;
};

// Address Management Functions
export const getAddresses = async () => {
    return await apiClient.get(`${API_URLS.IAM}/users/me/addresses`);
};

export const createAddress = async (addressData) => {
    return await apiClient.post(`${API_URLS.IAM}/users/me/addresses`, addressData);
};

export const updateAddress = async (addressId, addressData) => {
    return await apiClient.put(`${API_URLS.IAM}/users/me/addresses/${addressId}`, addressData);
};

export const deleteAddress = async (addressId) => {
    return await apiClient.delete(`${API_URLS.IAM}/users/me/addresses/${addressId}`);
};