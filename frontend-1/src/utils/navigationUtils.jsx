// utils/navigationUtils.js
import { ROLES } from './constants';

// Simple SVG Icon Components
const HomeIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const ShoppingBagIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
);

const PlusIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const CubeIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const BuildingStorefrontIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);

const TruckIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const CogIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const getSidebarItems = (userRole) => {
    const items = [];

    // Dashboard - available to all authenticated users
    items.push({
        to: '/dashboard',
        label: 'Dashboard',
        icon: HomeIcon
    });

    // Orders - available to specific roles
    if ([ROLES.CUSTOMER, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN].includes(userRole)) {
        items.push({
            to: '/orders',
            label: 'Orders',
            icon: ShoppingBagIcon,
            activePattern: /^\/orders($|\/)/
        });
    }

    // Create Order - available to customers and sales managers
    if ([ROLES.CUSTOMER, ROLES.SALES_MANAGER].includes(userRole)) {
        items.push({
            to: '/orders/create',
            label: 'Create Order',
            icon: PlusIcon
        });
    }

    // Inventory - available to inventory managers and admins
    if ([ROLES.INVENTORY_MANAGER, ROLES.ADMIN].includes(userRole)) {
        items.push({
            to: '/inventory',
            label: 'Inventory',
            icon: CubeIcon,
            activePattern: /^\/inventory($|\/)/
        });
    }

    // Warehouse - available to warehouse roles and admins
    if ([ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN].includes(userRole)) {
        items.push({
            to: '/warehouse',
            label: 'Warehouse',
            icon: BuildingStorefrontIcon,
            activePattern: /^\/warehouse($|\/)/
        });
    }

    // Logistics - available to logistics managers and admins
    if ([ROLES.LOGISTICS_MANAGER, ROLES.ADMIN].includes(userRole)) {
        items.push({
            to: '/logistics',
            label: 'Logistics',
            icon: TruckIcon,
            activePattern: /^\/logistics($|\/)/
        });
    }

    // Admin - available only to admins
    if (userRole === ROLES.ADMIN) {
        items.push({
            to: '/admin',
            label: 'Administration',
            icon: CogIcon
        });
    }

    return items;
};
