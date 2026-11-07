import axios from 'axios';
import { API_URLS } from '../utils/constants';
import { getCsrfToken, setAccess } from './sessionMemory';

export async function refreshSession() {
    const response = await axios.post(`${API_URLS.IAM}/auth/refresh`, {}, {
        withCredentials: true,
        headers: { 'X-CSRF-Token': getCsrfToken() },
    });
    setAccess(response.data.token, response.data.csrfToken);
    return response.data;
}

export async function logoutSession() {
    await axios.post(`${API_URLS.IAM}/auth/logout`, {}, {
        withCredentials: true,
        headers: { 'X-CSRF-Token': getCsrfToken() },
    });
}
