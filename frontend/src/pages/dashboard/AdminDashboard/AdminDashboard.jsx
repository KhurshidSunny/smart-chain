import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
import apiClient from '../../../services/apiClient';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
        queryKey: ['orders'],
        queryFn: () => apiClient.get('/orders').then(res => res.data),
    });

    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: () => apiClient.get('/users').then(res => res.data),
    });

    const handleSearch = (query) => {
        console.log('Admin search:', query);
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleManageUsers = () => navigate('/users');
    const handleManageInventory = () => navigate('/inventory');
    const handleViewLogs = () => navigate('/logs');

    const stats = [
        {
            title: 'Total Orders',
            value: orders ? orders.filter(o => o.status === 'completed').length : 'N/A',
            status: 'completed',
        },
        {
            title: 'Pending Orders',
            value: orders ? orders.filter(o => o.status === 'pending').length : 'N/A',
            status: 'pending',
        },
        {
            title: 'Active Users',
            value: users?.length || 'N/A',
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
                bgcolor: 'background-light',
                minHeight: 'calc(100vh - 64px)',
                width: '100vw',
                overflowX: 'hidden',
            }}
        >
            <Typography variant="h4" gutterBottom className="text-text-primary font-semibold">
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
                    message={ordersError?.message || usersError?.message}
                    sx={{ mb: 3 }}
                />
            )}

            {!ordersLoading && !usersLoading && !ordersError && !usersError && (
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-text-hover">
                            System Stats
                        </Typography>
                        <Grid container spacing={2}>
                            {stats.map((stat, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" className="text-text-secondary">
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h5" className="text-text-primary">
                                                {stat.value}
                                            </Typography>
                                            <StatusIndicator status={stat.status} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-text-hover">
                            Administrative Actions
                        </Typography>
                        <Grid container spacing={2}>
                            {actions.map((action, index) => (
                                <Grid item xs={12} sm={6} md={4} key={index}>
                                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" className="text-text-secondary">
                                                {action.label}
                                            </Typography>
                                        </CardContent>
                                        <CardActions>
                                            <ActionButton
                                                label="Go"
                                                onClick={action.onClick}
                                                size="small"
                                                sx={{ bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }}
                                            />
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-text-hover">
                            Recent Users
                        </Typography>
                        <Card sx={{ border: '1px solid', borderColor: 'neutral-light' }}>
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
                                        {users?.slice(0, 5).map((user) => (
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
                                    sx={{ bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }}
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