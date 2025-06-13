export const API_URLS = {
    IAM: import.meta.env.VITE_API_IAM_URL,
    SALES: import.meta.env.VITE_API_SALES_URL,
    INVENTORY: import.meta.env.VITE_API_INVENTORY_URL,
    WAREHOUSE: import.meta.env.VITE_API_WAREHOUSE_URL,
    LOGISTICS: import.meta.env.VITE_API_LOGISTICS_URL,
};

export const ROLES = {
    ADMIN: 'admin',
    WAREHOUSE_MANAGER: 'warehouse_manager',
    WAREHOUSE_STAFF: 'warehouse_staff',
    INVENTORY_MANAGER: 'inventory_manager',
    SALES_MANAGER: 'sales_manager',
    LOGISTICS_MANAGER: 'logistics_manager',
    CUSTOMER_SERVICE: 'customer_service',
    CUSTOMER: 'customer',
};