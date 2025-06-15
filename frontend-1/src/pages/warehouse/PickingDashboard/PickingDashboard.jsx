import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getPickingLists, assignPickingList } from '../../../services/warehouseService';
import { getWarehouseStaff } from '../../../services/userService';
import DataTable from '../../../components/common/DataDisplay/DataTable';

function PickingDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [pickingLists, setPickingLists] = useState([]);
    const [warehouseStaff, setWarehouseStaff] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const allowedRoles = [ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN];

    useEffect(() => {
        // Restrict access to allowed roles
        if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
            navigate('/login');
        }
    }, [isAuthenticated, user, navigate, allowedRoles]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch picking lists
                const pickingResponse = await getPickingLists();
                setPickingLists(pickingResponse.data);

                // Fetch warehouse staff (only for managers and admins who can assign)
                if (user?.role === ROLES.WAREHOUSE_MANAGER || user?.role === ROLES.ADMIN) {
                    const staffResponse = await getWarehouseStaff();
                    setWarehouseStaff(staffResponse.data.users || []);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    const handleAssign = async (pickingListId, staffId) => {
        if (user?.role !== ROLES.WAREHOUSE_MANAGER && user?.role !== ROLES.ADMIN) return;
        try {
            const res = await assignPickingList(pickingListId, { assignedTo: staffId });
            setPickingLists(pickingLists.pickingLists.map((list) =>
                list._id === pickingListId ? { ...list, assignedTo: staffId } : list
            ));
        } catch (err) {
            console.log(err)
            setError(err.response?.data?.message || 'Failed to assign picking list');
        }
    };

    // Helper function to get staff member name by ID
    const getStaffName = (staffId) => {
        const staff = warehouseStaff.find(s => s.id === staffId);
        return staff ? `${staff.firstName} ${staff.lastName}` : 'Unknown Staff';
    };

    const columns = [
        { key: 'orderNumber', header: 'Order Number' },
        { key: 'status', header: 'Status' },
        {
            key: 'items',
            header: 'Items',
            render: (list) => list.items.reduce((sum, item) => sum + item.quantity, 0),
        },
        {
            key: 'assignedTo',
            header: 'Assigned To',
            render: (list) =>
                user?.role === ROLES.WAREHOUSE_MANAGER || user?.role === ROLES.ADMIN ? (
                    <select
                        onChange={(e) => handleAssign(list._id, e.target.value)}
                        defaultValue={list.assignedTo || ''}
                        className="p-1 border rounded"
                        disabled={loading}
                    >
                        <option value="">Unassigned</option>
                        {warehouseStaff.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                                {staff.firstName} {staff.lastName}
                            </option>
                        ))}
                    </select>
                ) : list.assignedTo ? getStaffName(list.assignedTo) : 'Unassigned',
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (list) => (
                <button
                    onClick={() => navigate(`/warehouse/picking/${list._id}`)}
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
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Picking Dashboard</h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <DataTable
                    data={pickingLists.pickingLists || pickingLists}
                    columns={columns}
                />
            </div>
        </div>
    );
}

export default PickingDashboard;