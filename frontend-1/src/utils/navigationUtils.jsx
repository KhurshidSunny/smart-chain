import { ROLES } from './constants';
import {
    ArchiveIcon,
    BuildingStorefrontIcon,
    ChartBarIcon,
    ClipboardListIcon,
    CogIcon,
    CubeIcon,
    HomeIcon,
    PlusIcon,
    ShoppingBagIcon,
    TruckIcon,
    UserGroupIcon,
} from './navigationIcons';

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
            activePattern: /^\/(users|admin)($|\/)/,
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