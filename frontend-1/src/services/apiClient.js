import axios from 'axios';

const apiClient = axios.create({
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include JWT token
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

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;