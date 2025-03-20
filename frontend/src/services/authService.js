import apiClient from './apiClient';

export const loginUser = async ({ email, password }) => {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
};

export const registerUser = async ({ firstName, lastName, email, password }) => {
    console.log(firstName, lastName, password, email)
    const response = await apiClient.post('/register', { firstName, lastName, email, password });
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

export const logoutUser = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
};