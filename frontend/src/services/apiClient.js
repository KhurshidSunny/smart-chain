import axios from 'axios';

// Base URLs for each module
const BASE_URLS = {
  iam: 'https://iam.tasawuur.shop',
  inventory: 'https://inventory.tasawuur.shop',
  sales: 'https://sales.tasawuur.shop',
  warehouse: 'https://warehouse.tasawuur.shop',
};

// Factory function to create Axios instance for a specific module
const createApiClient = (module) => {
  if (!BASE_URLS[module]) {
    throw new Error(`Invalid module: ${module}. Available modules: ${Object.keys(BASE_URLS).join(', ')}`);
  }

  const client = axios.create({
    baseURL: BASE_URLS[module],
    timeout: 10000,
  });

  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};

// Export module-specific clients
export const iamApiClient = createApiClient('iam');
export const inventoryApiClient = createApiClient('inventory');
export const salesApiClient = createApiClient('sales');
export const warehouseApiClient = createApiClient('warehouse');

// Default export for backward compatibility (IAM module)
export default iamApiClient;