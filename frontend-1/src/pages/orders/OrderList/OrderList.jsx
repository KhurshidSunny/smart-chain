import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getOrders } from '../../../services/orderService';
import DataTable from '../../../components/common/DataDisplay/DataTable';
import { getUser } from '../../../services/userService';
import { getOrderAnomalies } from '../../../services/analyticsService';

function OrderList() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [orders, setOrders] = useState([]);
    const [anomalyMap, setAnomalyMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const allowedRoles = [ROLES.CUSTOMER, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN];

    useEffect(() => {
        // Check if user is authenticated and has the right role
        if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
            navigate('/login');
        }
    }, [isAuthenticated, user, navigate, allowedRoles]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await getOrders();
                const anomalyResponse = await getOrderAnomalies({ limit: 200 });
                const anomalies = anomalyResponse.data?.data || [];
                const anomaliesByOrder = anomalies.reduce((acc, entry) => {
                    acc[entry.orderId] = {
                        anomalyCount: entry.anomalyCount || 0,
                        severity: entry.lines?.[0]?.severity || 'medium',
                    };
                    return acc;
                }, {});

                // Use Promise.all to wait for all customer fetches to complete
                const ordersWithCustomers = await Promise.all(
                    response.data.map(async (order) => {
                        if (order.customerId && order.customerId !== user?.id) {
                            try {
                                const customerResponse = await getUser({ userId: order.customerId });
                                return {
                                    ...order,
                                    customer: customerResponse.data
                                };
                            } catch (customerError) {
                                console.error(`Failed to fetch customer ${order.customerId}:`, customerError);
                                return {
                                    ...order,
                                    customer: null
                                };
                            }
                        }
                        else {
                            return {
                                ...order,
                                customer: {
                                    firstName: user.firstName,
                                    lastName: user.lastName
                                }
                            };
                        }
                    })
                );

                setOrders(ordersWithCustomers);
                setAnomalyMap(anomaliesByOrder);
            } catch (err) {
                setError(err.response?.data?.message);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated && allowedRoles.includes(user?.role)) {
            fetchOrders();
        }
    }, [isAuthenticated]);

    const columns = [
        { key: 'orderNumber', header: 'Order Number' },
        {
            key: 'customerName',
            header: 'Customer',
            render: (order) => {
                if (!order.customer) return 'N/A';
                const firstName = order.customer.firstName || '';
                const lastName = order.customer.lastName || '';
                return `${firstName} ${lastName}`.trim() || 'N/A';
            }
        },
        { key: 'status', header: 'Status' },
        { key: 'totalAmount', header: 'Total', render: (order) => `$${order.totalAmount?.toFixed(2) || '0.00'}` },
        { key: 'createdAt', header: 'Created', render: (order) => new Date(order.createdAt).toLocaleDateString() },
        {
            key: 'anomalies',
            header: 'Anomalies',
            render: (order) => {
                const details = anomalyMap[order._id];
                if (!details || !details.anomalyCount) {
                    return (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                            None
                        </span>
                    );
                }

                const badgeClass =
                    details.severity === 'high'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700';

                return (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
                        {details.anomalyCount} flagged
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (order) => (
                <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="text-primary hover:underline"
                >
                    View
                </button>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <h1 className="text-3xl font-bold text-primary mb-6">Orders</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <p>Loading orders...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Orders</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <DataTable data={orders} columns={columns} />
            </div>
        </div>
    );
}

export default OrderList;