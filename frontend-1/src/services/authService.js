import apiClient from './apiClient';
import { API_URLS } from '../utils/constants';

export const login = async ({ email, password }) => {
    const response = await apiClient.post(`${API_URLS.IAM}/auth/login`, {
        email, // Changed from email to email to match your form
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