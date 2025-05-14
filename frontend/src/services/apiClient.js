
import axios from 'axios';

// Factory function to create Axios instance for a specific module
const createApiClient = (module, baseURL) => {
  if (!baseURL) {
    throw new Error(`Base URL for module "${module}" is not defined in .env`);
  }

  const client = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        // Add auth token if required
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
  });

  // Request interceptor to add JWT token to all requests
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error(`Request error for ${module}:`, error);
      return Promise.reject(error);
    }
  );

  return client;
};

// Create module-specific clients using .env URLs
export const iamApiClient = createApiClient('iam', import.meta.env.VITE_IAM_SERVICE_URL);
export const inventoryApiClient = createApiClient('inventory', import.meta.env.VITE_INVENTORY_SERVICE_URL);
export const salesApiClient = createApiClient('sales', import.meta.env.VITE_SALES_SERVICE_URL);
export const warehouseApiClient = createApiClient('warehouse', import.meta.env.VITE_WAREHOUSE_SERVICE_URL);

// Default export for backward compatibility (IAM module)
export default iamApiClient;
