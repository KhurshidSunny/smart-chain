import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from '@mui/material';
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import StatusIndicator from '../../../components/common/StatusIndicator/StatusIndicator';
import SearchBar from '../../../components/common/SearchBar/SearchBar';
import LoadingIndicator from '../../../components/common/LoadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../components/common/ErrorMessage/ErrorMessage';
import {
    fetchOrdersStart,
    fetchOrdersSuccess,
    fetchOrdersFailure,
} from '../../../redux/slices/orderSlice';
import {
    fetchUsersStart,
    fetchUsersSuccess,
    fetchUsersFailure,
} from '../../../redux/slices/userSlice';
import apiClient from '../../../services/apiClient';

/**
 * AdminDashboard Component
 * 
 * This component serves as the central dashboard for users with the 'admin' role in the Smart-Chain application.
 * It provides an overview of system statistics, quick administrative actions, and a table of recent users.
 * Features include:
 * - System Stats: Displays total orders, pending orders, and active users with status indicators, calculated from fetched data.
 * - Quick Actions: Offers buttons to manage users, inventory, and view system logs, with navigation to respective pages.
 * - Recent Users Table: Shows the 5 most recent users with their email, role, and status, with an option to view all users.
 * - Search Functionality: Includes a search bar to query the dashboard (navigates to a search results page).
 * - Data Fetching: Uses Redux to fetch orders and users via API calls, with loading and error states handled gracefully.
 * - Responsive Design: Utilizes Material-UI Grid for a layout that adapts to different screen sizes without overflow.
 * - Role Protection: Redirects non-admin users to the main dashboard (currently commented out, assumes ProtectedRoute handles this).
 */

const AdminDashboard = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { orders, loading: ordersLoading, error: ordersError } = useAppSelector((state) => state.orders);
    const { users, loading: usersLoading, error: usersError } = useAppSelector((state) => state.users);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Ensure only admins can access this page (redundant with ProtectedRoute, but good practice)
    // if (user?.role !== 'admin') {
    //     navigate('/dashboard'); // Redirect non-admins to MainDashboard
    //     return null;
    // }

    useEffect(() => {
        const fetchAdminData = async () => {
            // Fetch Orders
            dispatch(fetchOrdersStart());
            try {
                const ordersResponse = await apiClient.get('/orders');
                dispatch(fetchOrdersSuccess(ordersResponse.data));
            } catch (err) {
                dispatch(fetchOrdersFailure(err.message || 'Failed to fetch orders'));
            }

            // Fetch Users
            dispatch(fetchUsersStart());
            try {
                const usersResponse = await apiClient.get('/users');
                dispatch(fetchUsersSuccess(usersResponse.data));
            } catch (err) {
                dispatch(fetchUsersFailure(err.message || 'Failed to fetch users'));
            }
        };
        fetchAdminData();
    }, [dispatch]);

    const handleSearch = (query) => {
        console.log('Admin search:', query);
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleManageUsers = () => {
        navigate('/users');
    };

    const handleManageInventory = () => {
        navigate('/inventory');
    };

    const handleViewLogs = () => {
        navigate('/logs'); // Placeholder for system logs page
    };

    // Calculate stats from fetched data
    const stats = [
        {
            title: 'Total Orders',
            value: orders.length ? orders.filter(o => o.status === 'completed').length : 'N/A',
            status: 'completed',
        },
        {
            title: 'Pending Orders',
            value: orders.length ? orders.filter(o => o.status === 'pending').length : 'N/A',
            status: 'pending',
        },
        {
            title: 'Active Users',
            value: users.length || 'N/A',
            status: 'completed',
        },
    ];

    const actions = [
        { label: 'Manage Users', onClick: handleManageUsers },
        { label: 'Manage Inventory', onClick: handleManageInventory },
        { label: 'View System Logs', onClick: handleViewLogs },
    ];

    return (
        <Box
            sx={{
                p: 3,
                bgcolor: 'grey.50',
                minHeight: 'calc(100vh - 64px)', // Adjust for NavigationBar height
                width: '100vw',
                overflowX: 'hidden', // Prevent horizontal overflow
            }}
        >
            <Typography variant="h4" gutterBottom className="text-gray-800 font-semibold">
                Admin Dashboard
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
                Welcome, Admin!
            </Typography>

            <Box sx={{ maxWidth: 400, mb: 4 }}>
                <SearchBar onSearch={handleSearch} placeholder="Search admin dashboard..." />
            </Box>

            {(ordersLoading || usersLoading) && (
                <LoadingIndicator message="Loading admin data..." sx={{ mb: 3 }} />
            )}
            {(ordersError || usersError) && (
                <ErrorMessage
                    message={ordersError || usersError}
                    onRetry={() => {
                        if (ordersError) dispatch(fetchOrdersStart());
                        if (usersError) dispatch(fetchUsersStart());
                    }}
                    sx={{ mb: 3 }}
                />
            )}

            {!ordersLoading && !usersLoading && !ordersError && !usersError && (
                <Grid container spacing={3}>
                    {/* Stats Section */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-gray-700">
                            System Stats
                        </Typography>
                        <Grid container spacing={2}>
                            {stats.map((stat, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ border: '1px solid', borderColor: 'grey.300' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" className="text-gray-600">
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h5" className="text-gray-800">
                                                {stat.value}
                                            </Typography>
                                            <StatusIndicator status={stat.status} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* Quick Actions Section */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-gray-700">
                            Administrative Actions
                        </Typography>
                        <Grid container spacing={2}>
                            {actions.map((action, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ border: '1px solid', borderColor: 'grey.300' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" className="text-gray-600">
                                                {action.label}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <ActionButton
                                                label="Go"
                                                onClick={action.onClick}
                                                size="small"
                                                sx={{ bgcolor: 'blue.600', '&:hover': { bgcolor: 'blue.700' } }}
                                            />
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* Recent Users Section */}
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-gray-700">
                            Recent Users
                        </Typography>
                        <Card sx={{ border: '1px solid', borderColor: 'grey.300' }}>
                            <CardContent>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.slice(0, 5).map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>{user.role}</TableCell>
                                                <TableCell>
                                                    <StatusIndicator status={user.status || 'completed'} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardActions>
                                <ActionButton
                                    label="View All Users"
                                    onClick={handleManageUsers}
                                    size="small"
                                    sx={{ bgcolor: 'blue.600', '&:hover': { bgcolor: 'blue.700' } }}
                                />
                            </CardActions>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default AdminDashboard;