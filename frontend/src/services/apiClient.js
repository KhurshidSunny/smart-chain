/**
 * @file apiClient.js
 * @description Axios instance with request and response interceptors to handle authentication.
 * - Automatically adds JWT token to requests.
 * - Handles token refresh on 401 errors.
 * - Logs out the user if refresh fails.
 */

import axios from 'axios';
import { refreshToken } from './authService';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

// Create Axios instance with base API URL
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_IAM_SERVICE_URL || 'http://localhost:3001', // Change this based on environment
});

/**
 * Request Interceptor
 * - Attaches JWT access token to every request.
 */
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || store.getState().auth.token;
        if (token) config.headers.Authorization = `Bearer ${token}`; // Attach token
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 * - Handles 401 Unauthorized errors by attempting to refresh the token.
 * - If refresh is successful, retries the original request.
 * - If refresh fails, logs out the user and redirects to login.
 */
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Check if error is 401 (Unauthorized) and if request has not been retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Prevent infinite retry loops

            const refresh = localStorage.getItem('refreshToken');
            if (!refresh) {
                store.dispatch(logout()); // No refresh token → logout user
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh token
                const { token } = await refreshToken(refresh);
                localStorage.setItem('token', token); // Store new token
                originalRequest.headers.Authorization = `Bearer ${token}`; // Update request header
                return apiClient(originalRequest); // Retry original request
            } catch (err) {
                // Token refresh failed → logout user
                store.dispatch(logout());
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
