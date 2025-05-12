
import { iamApiClient } from './apiClient';

export const loginUser = async ({ email, password }) => {
  try {
    const response = await iamApiClient.post('/auth/login', { email, password });
    const { token, refreshToken } = response.data;
    if (token) {
      localStorage.setItem('token', token);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    return response.data;
  } catch (error) {
    throw new Error(`Failed to login: ${error.response?.data?.message || error.message}`);
  }
};

export const registerUser = async ({ firstName, lastName, email, password }) => {
  try {
    const response = await iamApiClient.post('auth/register', { firstName, lastName, email, password });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to register: ${error.response?.data?.message || error.message}`);
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No token found');
  try {
    const response = await iamApiClient.get('/me');
    return response.data.user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.response?.data?.message || error.message}`);
  }
};

/**
 * Logs out the user by clearing localStorage, React Query cache, and notifying the backend
 * - Requires queryClient (from useQueryClient) and navigate (from useNavigate) to be passed
 * - Backend logout blacklists the refresh token if provided
 */
export const logoutUser = async (queryClient, navigate) => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      await iamApiClient.post('/auth/logout', { refreshToken });
      console.log('Backend logout successful');
    }
  } catch (error) {
    console.warn('Backend logout failed:', error.message);
  }

  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  // Clear React Query cache
  queryClient.clear();

  // Redirect to login page
  navigate('/login');
};
