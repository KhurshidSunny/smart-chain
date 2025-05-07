import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:3000', // Adjust based on your backend
    timeout: 10000,
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default apiClient;