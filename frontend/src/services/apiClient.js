import axios from 'axios'; // Import axios library
import store from '../redux/store'; // Import store from redux
import { logout } from '../redux/slices/authSlice'; // Import logout action

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Adjust based on your backend URL or environment variable
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            store.dispatch(logout());
            window.location.href = '/login'; // Redirect to login on unauthorized
        }
        return Promise.reject(error);
    }
);

export default apiClient;
