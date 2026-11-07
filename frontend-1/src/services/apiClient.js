import axios from 'axios';
import { getAccessToken } from './sessionMemory';

const apiClient = axios.create({
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config || {};
        const url = original.url || '';
        const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
        if (error.response?.status !== 401 || original._retry || isAuthCall) {
            return Promise.reject(error);
        }

        original._retry = true;
        try {
            const { refreshSession } = await import('./sessionClient');
            const data = await refreshSession();
            const { default: useAuthStore } = await import('../stores/authStore');
            useAuthStore.setState({ token: data.token, user: data.user, isAuthenticated: true });
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${data.token}`;
            return apiClient(original);
        } catch (refreshError) {
            const { default: useAuthStore } = await import('../stores/authStore');
            useAuthStore.getState().forceLogout();
            return Promise.reject(refreshError);
        }
    }
);

export default apiClient;