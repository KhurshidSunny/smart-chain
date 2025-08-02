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

// Additional icons for sub-items
const DocumentTextIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ClipboardListIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

const ArchiveIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
);

const ChartBarIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const UserGroupIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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

    // Orders - available to specific roles with sub-items
    if ([ROLES.CUSTOMER, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN].includes(userRole)) {
        const orderSubItems = [];

        // All order roles can view all orders
        orderSubItems.push({
            to: '/orders',
            label: 'All Orders',
            icon: ShoppingBagIcon,
            activePattern: /^\/orders$|^\/orders\/view/
        });

        // Customers and sales managers can create orders
        if ([ROLES.CUSTOMER, ROLES.SALES_MANAGER].includes(userRole)) {
            orderSubItems.push({
                to: '/orders/create',
                label: 'Create Order',
                icon: PlusIcon
            });
        }

        items.push({
            to: '/orders', // Main route for orders
            label: 'Orders',
            icon: ShoppingBagIcon,
            activePattern: /^\/orders($|\/)/,
            subItems: orderSubItems
        });
    }

    // Inventory - available to inventory managers and admins
    if ([ROLES.INVENTORY_MANAGER, ROLES.ADMIN].includes(userRole)) {
        items.push({
            to: '/inventory',
            label: 'Inventory',
            icon: CubeIcon,
            activePattern: /^\/inventory($|\/)/,
            subItems: [
                {
                    to: '/inventory',
                    label: 'Stock Overview',
                    icon: ChartBarIcon,
                    activePattern: /^\/inventory$|^\/inventory\/overview/
                },
                {
                    to: '/inventory/products',
                    label: 'Manage Items',
                    icon: CubeIcon,
                    activePattern: /^\/inventory\/items/
                },
            ]
        });
    }

    // Warehouse - available to warehouse roles and admins with sub-items
    if ([ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN].includes(userRole)) {
        const warehouseSubItems = [
            {
                to: '/warehouse/picking-lists',
                label: 'Picking Lists',
                icon: ClipboardListIcon,
                activePattern: /^\/warehouse\/picking-lists/
            },
            {
                to: '/warehouse/packing-lists',
                label: 'Packing Lists',
                icon: ArchiveIcon,
                activePattern: /^\/warehouse\/packing-lists/
            }
        ];


        items.push({
            to: '#',
            label: 'Warehouse',
            icon: BuildingStorefrontIcon,
            activePattern: /^\/warehouse($|\/)/,
            subItems: warehouseSubItems
        });
    }

    // Logistics - available to logistics managers and admins
    if ([ROLES.LOGISTICS_MANAGER, ROLES.ADMIN].includes(userRole)) {
        items.push({
            to: '/logistics',
            label: 'Logistics',
            icon: TruckIcon,
            activePattern: /^\/logistics($|\/)/,
            subItems: [
                {
                    to: '/logistics',
                    label: 'Shipments',
                    icon: TruckIcon,
                    activePattern: /^\/logistics$|^\/logistics\/shipments/
                },
            ]
        });
    }

    // Admin - available only to admins
    if (userRole === ROLES.ADMIN) {
        items.push({
            to: '/users',
            label: 'Administration',
            icon: CogIcon,
            activePattern: /^\/users($|\/)/,
            subItems: [
                {
                    to: '/users',
                    label: 'User Management',
                    icon: UserGroupIcon,
                    activePattern: /^\/users($|\/)/
                },
                {
                    to: '/admin/settings',
                    label: 'System Settings',
                    icon: CogIcon,
                    activePattern: /^\/admin\/settings/
                },
                {
                    to: '/admin/reports',
                    label: 'System Reports',
                    icon: ChartBarIcon,
                    activePattern: /^\/admin\/reports/
                }
            ]
        });
    }

    return items;
};