// src/pages/dashboard/MainDashboard/MainDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { getOrders } from '../../../services/orderService';
import { getInventorySummary } from '../../../services/inventoryService';
import { getShipments } from '../../../services/logisticsService';
import { getPickingLists } from '../../../services/warehouseService';
import CustomerProfile from '../../../components/specific/customer/Profile';

const MainDashboard = () => {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState({
        activeOrders: 0,
        lowStockItems: 0,
        activeShipments: 0,
        pendingPickingLists: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch role-specific metrics on mount for authenticated users
    useEffect(() => {
        const fetchMetrics = async () => {
            if (!isAuthenticated || !user) return;

            setLoading(true);
            try {
                const role = user.role; // Assuming roleId is stored in user object
                const promises = [];

                // Fetch metrics based on user role
                if (['admin', 'sales_manager', 'customer'].includes(role)) {
                    promises.push(getOrders().then((res) => ({
                        activeOrders: res.data?.length || 0,
                    })));
                }
                if (['admin', 'inventory_manager'].includes(role)) {
                    promises.push(getInventorySummary().then((res) => ({
                        lowStockItems: res.data?.lowStockCount || 0,
                    })));
                }
                if (['admin', 'logistics_manager'].includes(role)) {
                    promises.push(getShipments({ status: 'InTransit' }).then((res) => ({
                        activeShipments: res.data?.length || 0,
                    })));
                }
                if (['admin', 'warehouse_manager', 'warehouse_staff'].includes(role)) {
                    promises.push(getPickingLists({ status: 'Pending' }).then((res) => ({
                        pendingPickingLists: res.data?.length || 0,
                    })));
                }

                const results = await Promise.all(promises);
                const combinedMetrics = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
                setMetrics((prev) => ({ ...prev, ...combinedMetrics }));
            } catch (err) {
                console.error('Error fetching metrics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [isAuthenticated, user]);

    // Handle navigation to role-specific pages
    const handleAction = (path) => {
        navigate(path);
    };

    // Role-based content and actions
    const renderRoleContent = () => {
        if (!isAuthenticated || !user) {
            return (
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Smart-Chain</h2>
                    <p className="text-lg text-gray-600 mb-6">
                        Streamline your supply chain with real-time order tracking and QR code integration.
                    </p>
                    <div className="space-x-4">
                        <button
                            onClick={() => handleAction('/login')}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            Login
                        </button>
                        <button
                            onClick={() => handleAction('/register')}
                            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
                        >
                            Register
                        </button>
                    </div>
                </div>
            );
        }

        const role = user.role;
        const roleActions = {
            admin: [
                { label: 'Manage Users', path: '/users' },
                { label: 'View System Dashboard', path: '/dashboard/admin' },
            ],
            customer: [
                { label: 'Create New Order', path: '/orders/create' },
                { label: 'Track My Orders', path: '/orders' },
            ],
            warehouse_manager: [
                { label: 'Manage Picking Lists', path: '/warehouse/picking' },
                { label: 'View Warehouse Dashboard', path: '/dashboard/warehouse-manager' },
            ],
            warehouse_staff: [
                { label: 'View Assigned Picking Lists', path: '/warehouse/picking' },
                { label: 'Pack Orders', path: '/warehouse/packing' },
            ],
            inventory_manager: [
                { label: 'Manage Inventory', path: '/inventory' },
                { label: 'View Inventory Dashboard', path: '/dashboard/inventory' },
            ],
            sales_manager: [
                { label: 'Manage Orders', path: '/orders' },
                { label: 'View Sales Dashboard', path: '/dashboard/sales' },
            ],
            logistics_manager: [
                { label: 'Manage Shipments', path: '/logistics' },
                { label: 'View Logistics Dashboard', path: '/dashboard/logistics' },
            ],
            customer_service: [
                { label: 'View Feedback', path: '/feedback' },
                { label: 'Manage Orders', path: '/orders' },
            ],
        };

        return (
            <div className="space-y-8">
                {/* Welcome Header */}
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                        Welcome, {user.firstName} ({role})
                    </h2>
                    
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {role === 'admin' || role === 'sales_manager' || role === 'customer' ? (
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">Active Orders</h3>
                                <p className="text-2xl">{loading ? 'Loading...' : metrics.activeOrders}</p>
                            </div>
                        ) : null}
                        {role === 'admin' || role === 'inventory_manager' ? (
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">Low Stock Items</h3>
                                <p className="text-2xl">{loading ? 'Loading...' : metrics.lowStockItems}</p>
                            </div>
                        ) : null}
                        {role === 'admin' || role === 'logistics_manager' ? (
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">Active Shipments</h3>
                                <p className="text-2xl">{loading ? 'Loading...' : metrics.activeShipments}</p>
                            </div>
                        ) : null}
                        {role === 'admin' || role === 'warehouse_manager' || role === 'warehouse_staff' ? (
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">Pending Picking Lists</h3>
                                <p className="text-2xl">{loading ? 'Loading...' : metrics.pendingPickingLists}</p>
                            </div>
                        ) : null}
                    </div>

                    {error && <p className="text-red-600 mt-4">{error}</p>}
                </div>

                {/* Customer Profile Section */}
                {role === 'customer' && (
                    <CustomerProfile />
                )}

            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4">
            <div className="max-w-6xl mx-auto">{renderRoleContent()}</div>
        </div>
    );
};

export default MainDashboard;