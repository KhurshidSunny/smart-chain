import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getShipments } from '../../../services/logisticsService';
import DataTable from '../../../components/common/DataDisplay/DataTable';

function ShipmentDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [shipments, setShipments] = useState([]);
    const [error, setError] = useState(null);
    const allowedRoles = [ROLES.LOGISTICS_MANAGER, ROLES.ADMIN];

    // Restrict access to allowed roles
    if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
        navigate('/login');
    }

    useEffect(() => {
        const fetchShipments = async () => {
            try {
                const response = await getShipments();
                setShipments(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load shipments');
            }
        };
        fetchShipments();
    }, []);

    const columns = [
        { key: 'trackingNumber', header: 'Tracking Number' },
        { key: 'orderNumber', header: 'Order Number' },
        { key: 'carrier', header: 'Carrier' },
        { key: 'status', header: 'Status' },
        {
            key: 'estimatedDeliveryDate',
            header: 'Est. Delivery',
            render: (shipment) =>
                shipment.estimatedDeliveryDate
                    ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString()
                    : 'N/A',
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (shipment) => (
                <button
                    onClick={() => navigate(`/logistics/shipments/${shipment._id}`)}
                    className="text-primary hover:underline"
                >
                    View
                </button>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Shipment Dashboard</h1>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <DataTable data={shipments} columns={columns} />
            </div>
        </div>
    );
}

export default ShipmentDashboard;