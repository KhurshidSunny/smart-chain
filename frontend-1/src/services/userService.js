// userService.js
import apiClient from "./apiClient"
import { API_URLS } from "../utils/constants"

export const getUser = async ({ userId }) => {
    return await apiClient.get(`${API_URLS.IAM}/users/${userId}`)
}

export const getUsers = async (filters = {}) => {
    const params = new URLSearchParams();

    // Add filters to query parameters
    if (filters.role) {
        params.append('role', filters.role);
    }
    if (filters.roleId) {
        params.append('roleId', filters.roleId);
    }
    if (filters.isActive !== undefined) {
        params.append('isActive', filters.isActive);
    }

    const queryString = params.toString();
    const url = queryString ? `${API_URLS.IAM}/users?${queryString}` : `${API_URLS.IAM}/users`;

    return await apiClient.get(url);
}

// Convenience function specifically for warehouse staff
export const getWarehouseStaff = async () => {
    return await getUsers({
        role: 'warehouse_staff',
        isActive: true
    });
}