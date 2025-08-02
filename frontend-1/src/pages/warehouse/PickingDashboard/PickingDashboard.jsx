import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getPickingLists, assignPickingList, updatePickingListStatus } from '../../../services/warehouseService';
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
                // Fetch picking lists (backend will filter for warehouse staff)
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
            await assignPickingList(pickingListId, { assignedTo: staffId });
            // Refresh the data
            const pickingResponse = await getPickingLists();
            setPickingLists(pickingResponse.data);
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || 'Failed to assign picking list');
        }
    };

    const handleStatusChange = async (pickingListId, newStatus) => {
        try {
            await updatePickingListStatus(pickingListId, { status: newStatus });
            // Update local state
            const pickingListsArray = pickingLists.pickingLists || pickingLists;
            const updatedLists = pickingListsArray.map((list) =>
                list._id === pickingListId ? { ...list, status: newStatus } : list
            );

            if (pickingLists.pickingLists) {
                setPickingLists({ ...pickingLists, pickingLists: updatedLists });
            } else {
                setPickingLists(updatedLists);
            }
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || 'Failed to update status');
        }
    };

    // Helper function to get staff member name by ID
    const getStaffName = (staffMember) => {
        if (staffMember && staffMember.firstName && staffMember.lastName) {
            return `${staffMember.firstName} ${staffMember.lastName}`;
        }
        return 'Unknown Staff';
    };

    const columns = [
        { key: 'orderNumber', header: 'Order Number' },
        {
            key: 'status',
            header: 'Status',
            render: (list) => {
                // Only warehouse staff can change status of their assigned lists
                if (user?.role === ROLES.WAREHOUSE_STAFF) {
                    return (
                        <select
                            value={list.status}
                            onChange={(e) => handleStatusChange(list._id, e.target.value)}
                            className="p-1 border rounded"
                            disabled={loading}
                        >
                            <option value="Pending">Pending</option>
                            <option value="InProgress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    );
                }
                return list.status;
            }
        },
        {
            key: 'items',
            header: 'Items',
            render: (list) => list.items.reduce((sum, item) => sum + item.quantity, 0),
        },


        // Conditionally include assignedTo column
        ...(user?.role === ROLES.WAREHOUSE_MANAGER || user?.role === ROLES.ADMIN
            ? [{
                key: 'assignedTodo',
                header: 'Assigned To',
                render: (list) => (
                    <select
                        onChange={(e) => handleAssign(list._id, e.target.value)}
                        value={list.assignedTo?._id || list.assignedTo || ''}
                        className="p-1 border rounded"
                        disabled={loading}
                    >
                        <option value="">Unassigned</option>
                        {warehouseStaff.map((staff) => (
                            <option key={staff.id || staff._id} value={staff.id || staff._id}>
                                {staff.firstName} {staff.lastName}
                            </option>
                        ))}
                    </select>
                )
            }]
            : []),
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

    const pickingListsArray = pickingLists.pickingLists || pickingLists;
    const isWarehouseStaff = user?.role === ROLES.WAREHOUSE_STAFF;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">
                {isWarehouseStaff ? 'My Picking Tasks' : 'Items to Pick'}
            </h1>
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {pickingListsArray.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        {isWarehouseStaff
                            ? 'No picking tasks assigned to you yet.'
                            : 'No picking lists available.'
                        }
                    </div>
                ) : (
                    <DataTable
                        data={pickingListsArray}
                        columns={columns}
                    />
                )}
            </div>
        </div>
    );
}

export default PickingDashboard;