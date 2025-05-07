import apiClient from './apiClient';

<<<<<<< HEAD
export const loginUser = async ({email, password}) => {
    console.log(email, password)
    const response = await apiClient.post('auth/login', { email, password });
    console.log(response)
    return response.data;
=======
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_IAM_SERVICE_URL || 'http://localhost:3001', // Standardize with apiClient.js
    headers: { 'Content-Type': 'application/json' },
});
>>>>>>> bc5b8243e6c6cfdbd6a66b21b95223435bc7bf08

};

export const registerUser = async ({ firstName, lastName, email, password }) => {
    // console.log(firstName,lastName,email,password)
    const response = await apiClient.post('auth/register', { firstName, lastName, email, password });
    console.log(response)
    return response.data;

};

export const getCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No token found');
    const response = await apiClient.get('/me', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.user;
};

<<<<<<< HEAD
export const logoutUser = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};
=======
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
    // Redirect to login page
    navigate('/login');
};
>>>>>>> bc5b8243e6c6cfdbd6a66b21b95223435bc7bf08
