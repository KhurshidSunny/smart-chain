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
    Button,
} from '@mui/material';
import ActionButton from '../../components/common/ActionButton/ActionButton';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator';
import SearchBar from '../../components/common/SearchBar/SearchBar';
import { getCurrentUser } from '../../services/authService';

const MainDashboard = () => {
    const navigate = useNavigate();
    const { data: user, isLoading } = useQuery({
        queryKey: ['authUser'],
        queryFn: getCurrentUser,
    });

    const role = user?.role || 'customer';

    const getDashboardContent = () => {
        const commonActions = [
            { label: 'View Orders', path: '/orders', status: 'inProgress' },
        ];

        const roleSpecificContent = {
            admin: {
                stats: [
                    { title: 'Total Orders', value: '1,234', status: 'completed' },
                    { title: 'Pending Shipments', value: '56', status: 'pending' },
                    { title: 'Users', value: '89', status: 'completed' },
                ],
                actions: [
                    { label: 'Manage Inventory', path: '/inventory' },
                    { label: 'View Warehouse', path: '/warehouse' },
                    { label: 'Check Feedback', path: '/feedback' },
                ],
            },
            warehouse_manager: {
                stats: [
                    { title: 'Items in Stock', value: '5,678', status: 'completed' },
                    { title: 'Pending Tasks', value: '12', status: 'pending' },
                ],
                actions: [
                    { label: 'Scan QR Code', path: '/qr-scanner' },
                    { label: 'Update Inventory', path: '/inventory' },
                ],
            },
            warehouse_staff: {
                stats: [
                    { title: 'Tasks Today', value: '8', status: 'inProgress' },
                ],
                actions: [
                    { label: 'Scan QR Code', path: '/qr-scanner' },
                ],
            },
            inventory_manager: {
                stats: [
                    { title: 'Low Stock Items', value: '15', status: 'warning' },
                ],
                actions: [
                    { label: 'Update Inventory', path: '/inventory' },
                ],
            },
            sales_manager: {
                stats: [
                    { title: 'Customer Feedback', value: '45', status: 'completed' },
                ],
                actions: [
                    { label: 'View Feedback', path: '/feedback' },
                ],
            },
            logistics_manager: {
                stats: [
                    { title: 'Shipments Today', value: '23', status: 'inProgress' },
                ],
                actions: [
                    { label: 'Track Logistics', path: '/logistics' },
                ],
            },
            customer_service: {
                stats: [
                    { title: 'Open Tickets', value: '10', status: 'pending' },
                ],
                actions: [
                    { label: 'View Feedback', path: '/feedback' },
                ],
            },
            customer: {
                stats: [
                    { title: 'Your Orders', value: '3', status: 'completed' },
                ],
                actions: [
                    { label: 'Track Order', path: '/tracking' },
                    { label: 'Submit Feedback', path: '/feedback' },
                ],
            },
        };

        const content = {
            stats: [...(roleSpecificContent[role]?.stats || [])],
            actions: [...commonActions, ...(roleSpecificContent[role]?.actions || [])],
        };
        return content;
    };

    const { stats, actions } = getDashboardContent();

    const handleSearch = (query) => {
        console.log('Dashboard search:', query);
        navigate(`/search?q=${encodeURIComponent(query)}`);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-background-light">Loading...</div>;
    }

    if (!user) {
        return (
            <Box
                sx={{
                    p: 3,
                    bgcolor: 'background-light',
                    minHeight: 'calc(100vh - 64px)',
                    width: '100vw',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography variant="h4" gutterBottom className="text-text-primary font-semibold">
                    Welcome to Smart-Chain
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 4 }}>
                    Please log in or register to access your dashboard.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/login')}
                        sx={{ px: 4, py: 1.5, bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }}
                    >
                        Login
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/register')}
                        sx={{ px: 4, py: 1.5, borderColor: 'primary', color: 'primary', '&:hover': { borderColor: 'primary-dark', color: 'primary-dark' } }}
                    >
                        Register
                    </Button>
                </Box>
            </Box>
        );
    }

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
                Welcome to Smart-Chain Dashboard
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom>
                Hello, {role.replace('_', ' ').toUpperCase()}!
            </Typography>

            <Box sx={{ maxWidth: 400, mb: 4, width: '100%' }}>
                <SearchBar onSearch={handleSearch} placeholder={`Search ${role} dashboard...`} />
            </Box>

            <Grid container spacing={3} sx={{ width: '100%' }}>
                {stats.length > 0 && (
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-text-hover">
                            Quick Stats
                        </Typography>
                        <Grid container spacing={2}>
                            {stats.map((stat, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light', width: '100%' }}>
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
                )}

                {actions.length > 0 && (
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom className="text-text-hover">
                            Quick Actions
                        </Typography>
                        <Grid container spacing={2}>
                            {actions.map((action, index) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                                    <Card sx={{ border: '1px solid', borderColor: 'neutral-light', width: '100%' }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" className="text-text-secondary">
                                                {action.label}
                                            </Typography>
                                            {action.status && <StatusIndicator status={action.status} />}
                                        </CardContent>
                                        <CardActions>
                                            <ActionButton
                                                label="Go"
                                                onClick={() => navigate(action.path)}
                                                size="small"
                                                sx={{ bgcolor: 'primary', '&:hover': { bgcolor: 'primary-dark' } }}
                                            />
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default MainDashboard;