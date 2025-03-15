import axios from 'axios';
import { logout } from '../redux/slices/authSlice';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_IAM_SERVICE_URL || 'http://localhost:3000', // IAM service URL
    headers: { 'Content-Type': 'application/json' },
});

export const loginUser = async ({ email, password }) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data; // { token, refreshToken, user }
};

export const registerUser = async ({ email, password, firstName, lastName }) => {
    const response = await apiClient.post('/auth/register', { email, password, firstName, lastName });
    console.log(response);
    return response.data; // { token, refreshToken, user }
};

export const refreshToken = async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data; // { token }
};

/**
 * Logs out the user by clearing Redux state, localStorage, and notifying the backend
 * - Requires dispatch and navigate to be passed from the calling component
 * - Backend logout will blacklist the refresh token (to be implemented)
 */
export const logoutUser = async (dispatch, navigate) => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            await apiClient.post('/auth/logout', { refreshToken }); // Notify backend to blacklist token
            console.log('Backend logout successful');
        }
    } catch (err) {
        console.warn('Backend logout failed:', err.message); // Silent fail for now
    }
    // Clear Redux state
    dispatch(logout());
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    // Redirect to login page
    navigate('/login');
};