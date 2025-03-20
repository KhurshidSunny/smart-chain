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
import {
    ShoppingCart,
    Pending,
    People,
    Group,
    Inventory,
    Description,
} from '@mui/icons-material'; // Added icons
import ActionButton from '../../../components/common/ActionButton/ActionButton';
import StatusIndicator from '../../../components/common/StatusIndicator/StatusIndicator';
import SearchBar from '../../../components/common/SearchBar/SearchBar';
import LoadingIndicator from '../../../components/common/LoadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../components/common/ErrorMessage/ErrorMessage';
import apiClient from '../../../services/apiClient';

// Mock orders data
const mockOrders = [
    {
        _id: '60d5f4832f8fb814b576a1b1',
        orderNumber: 'ORD-001',
        customerId: '60d5f4832f8fb814b576a1a1',
        items: [
            { productId: '60d5f4832f8fb814b576a1c1', name: 'Laptop', quantity: 1, unitPrice: 999.99 },
            { productId: '60d5f4832f8fb814b576a1c2', name: 'Mouse', quantity: 2, unitPrice: 19.99 },
        ],
        shippingAddress: {
            addressId: '60d5f4832f8fb814b576a1d1',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
        },
        totalAmount: 1039.97,
        status: 'completed',
        qrCode: 'QR_ORD_001_123456',
        notes: 'Customer requested fast shipping',
        createdBy: '60d5f4832f8fb814b576a1a1',
        createdAt: new Date('2025-03-15T10:00:00Z'),
        updatedAt: new Date('2025-03-16T12:00:00Z'),
    },
    {
        _id: '60d5f4832f8fb814b576a1b2',
        orderNumber: 'ORD-002',
        customerId: '60d5f4832f8fb814b576a1a2',
        items: [
            { productId: '60d5f4832f8fb814b576a1c3', name: 'Headphones', quantity: 1, unitPrice: 59.99 },
        ],
        shippingAddress: {
            addressId: '60d5f4832f8fb814b576a1d2',
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            country: 'USA',
        },
        totalAmount: 59.99,
        status: 'pending',
        qrCode: 'QR_ORD_002_789012',
        notes: 'Awaiting payment confirmation',
        createdBy: '60d5f4832f8fb814b576a1a2',
        createdAt: new Date('2025-03-17T14:00:00Z'),
        updatedAt: new Date('2025-03-17T14:00:00Z'),
    },
    {
        _id: '60d5f4832f8fb814b576a1b3',
        orderNumber: 'ORD-003',
        customerId: '60d5f4832f8fb814b576a1a3',
        items: [
            { productId: '60d5f4832f8fb814b576a1c4', name: 'Monitor', quantity: 1, unitPrice: 199.99 },
            { productId: '60d5f4832f8fb814b576a1c5', name: 'Keyboard', quantity: 1, unitPrice: 49.99 },
        ],
        shippingAddress: {
            addressId: '60d5f4832f8fb814b576a1d3',
            street: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA',
        },
        totalAmount: 249.98,
        status: 'shipped',
        qrCode: 'QR_ORD_003_345678',
        notes: 'Shipped via UPS',
        createdBy: '60d5f4832f8fb814b576a1a3',
        createdAt: new Date('2025-03-18T09:00:00Z'),
        updatedAt: new Date('2025-03-19T11:00:00Z'),
    },
];

// Mock users data
const mockUsers = [
    { id: '1', email: 'admin@example.com', role: 'admin', status: 'completed' },
    { id: '2', email: 'customer1@example.com', role: 'customer', status: 'completed' },
];

const AdminDashboard = () => {
    const navigate = useNavigate();

    const orders = mockOrders;
    const ordersLoading = false;
    const ordersError = null;

    const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
        queryKey: ['users'],
        queryFn: () => apiClient.get('/users').then(res => res.data),
        onError: () => console.log('Failed to fetch users, using mock data'),
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
            icon: <ShoppingCart />,
            bgColor: '#e3f2fd', // Light blue
            iconColor: '#1976d2', // Blue
        },
        {
            title: 'Pending Orders',
            value: orders ? orders.filter(o => o.status === 'pending').length : 'N/A',
            status: 'pending',
            icon: <Pending />,
            bgColor: '#fff3e0', // Light yellow
            iconColor: '#f57c00', // Orange
        },
        {
            title: 'Active Users',
            value: users?.length || mockUsers.length,
            status: 'completed',
            icon: <People />,
            bgColor: '#e8f5e9', // Light green
            iconColor: '#388e3c', // Green
        },
    ];

    const actions = [
        {
            label: 'Manage Users',
            onClick: handleManageUsers,
            icon: <Group />,
            bgColor: '#f3e5f5', // Light purple
            iconColor: '#7b1fa2', // Purple
        },
        {
            label: 'Manage Inventory',
            onClick: handleManageInventory,
            icon: <Inventory />,
            bgColor: '#ffebee', // Light red
            iconColor: '#d32f2f', // Red
        },
        {
            label: 'View System Logs',
            onClick: handleViewLogs,
            icon: <Description />,
            bgColor: '#eceff1', // Light gray
            iconColor: '#455a64', // Gray
        },
    ];

    const displayUsers = Array.isArray(users) ? users : mockUsers;

    return (
        <Box
            sx={{
                p: 4, // Increased padding for breathing room
                bgcolor: 'background-light',
                minHeight: 'calc(100vh - 64px)',
                width: '100vw',
                overflowX: 'hidden',
            }}
        >
            <Typography variant="h4" gutterBottom className="text-text-primary font-semibold">
                Admin Dashboard
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
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
                    message={ordersError?.message || usersError?.message || 'Data fetch failed, using mock data'}
                    sx={{ mb: 3 }}
                />
            )}

            <Grid container spacing={3}>
                {/* System Stats */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom className="text-text-hover" sx={{ fontWeight: 'medium' }}>
                        System Stats
                    </Typography>
                    <Grid container spacing={3}>
                        {stats.map((stat, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'neutral-light',
                                        backgroundColor: stat.bgColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', // Subtle shadow
                                        borderRadius: 2, // Rounded corners
                                        transition: 'transform 0.2s', // Hover effect
                                        '&:hover': { transform: 'translateY(-4px)' },
                                    }}
                                >
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {React.cloneElement(stat.icon, { sx: { fontSize: 32, color: stat.iconColor } })}
                                        <Box>
                                            <Typography variant="subtitle1" className="text-text-secondary" sx={{ fontSize: '1rem' }}>
                                                {stat.title}
                                            </Typography>
                                            <Typography variant="h5" className="text-text-primary" sx={{ fontWeight: 'bold' }}>
                                                {stat.value}
                                            </Typography>
                                            <StatusIndicator status={stat.status} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Administrative Actions */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom className="text-text-hover" sx={{ fontWeight: 'medium' }}>
                        Administrative Actions
                    </Typography>
                    <Grid container spacing={3}>
                        {actions.map((action, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'neutral-light',
                                        backgroundColor: action.bgColor,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                        borderRadius: 2,
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'translateY(-4px)' },
                                    }}
                                >
                                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        {React.cloneElement(action.icon, { sx: { fontSize: 32, color: action.iconColor } })}
                                        <Typography variant="subtitle1" className="text-text-secondary" sx={{ fontSize: '1rem' }}>
                                            {action.label}
                                        </Typography>
                                    </CardContent>
                                    <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                                        <ActionButton
                                            label="Go"
                                            onClick={action.onClick}
                                            size="small"
                                            sx={{
                                                bgcolor: action.iconColor,
                                                color: 'white',
                                                '&:hover': { bgcolor: `${action.iconColor}cc` }, // Slightly lighter on hover
                                                fontWeight: 'medium',
                                                px: 3,
                                            }}
                                        />
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>

                {/* Recent Users */}
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom className="text-text-hover" sx={{ fontWeight: 'medium' }}>
                        Recent Users
                    </Typography>
                    <Card
                        sx={{
                            border: '1px solid',
                            borderColor: 'neutral-light',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayUsers.slice(0, 5).map((user) => (
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
                        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                            <ActionButton
                                label="View All Users"
                                onClick={handleManageUsers}
                                size="small"
                                sx={{
                                    bgcolor: '#1976d2',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#115293' },
                                    fontWeight: 'medium',
                                    px: 3,
                                }}
                            />
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;