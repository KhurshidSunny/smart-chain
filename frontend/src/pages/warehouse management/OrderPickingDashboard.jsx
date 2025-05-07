
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Select,
    MenuItem,
    Tooltip,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Reused from other pages

// Mock active picking lists
const mockPickingLists = [
    {
        orderId: 'ORD001',
        status: 'inProgress',
        assignedStaff: 'John Doe',
        itemsCount: 5,
    },
    {
        orderId: 'ORD002',
        status: 'pending',
        assignedStaff: 'Jane Smith',
        itemsCount: 3,
    },
    {
        orderId: 'ORD003',
        status: 'completed',
        assignedStaff: 'Mike Brown',
        itemsCount: 7,
    },
];

// Mock unassigned orders
const mockUnassignedOrders = [
    {
        orderId: 'ORD004',
        itemsCount: 4,
    },
    {
        orderId: 'ORD005',
        itemsCount: 6,
    },
];

// Mock staff for assignment
const mockStaff = ['John Doe', 'Jane Smith', 'Mike Brown', 'Sarah Wilson'];

function OrderPickingDashboard() {
    const isManager = true; // Temporary flag, replace with real role check

    return (
        <Box sx={{ p: 4, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
            {/* Page Title */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                        Order Picking Dashboard
                    </Typography>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Manage and monitor order picking operations
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Active Picking Lists */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Active Picking Lists
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Order ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Assigned Staff</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Items</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockPickingLists.map((order) => (
                                        <TableRow key={order.orderId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                            <TableCell>{order.orderId}</TableCell>
                                            <TableCell>
                                                <StatusIndicator status={order.status} label={order.status} />
                                            </TableCell>
                                            <TableCell>{order.assignedStaff}</TableCell>
                                            <TableCell>{order.itemsCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Staff Assignment Interface (Manager-Only) */}
                {isManager && (
                    <Grid item xs={12} md={6}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                    Staff Assignment
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Select
                                        displayEmpty
                                        defaultValue=""
                                        sx={{ flexGrow: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                    >
                                        <MenuItem value="" disabled>
                                            Select Order
                                        </MenuItem>
                                        {mockUnassignedOrders.map((order) => (
                                            <MenuItem key={order.orderId} value={order.orderId}>
                                                {order.orderId}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <Select
                                        displayEmpty
                                        defaultValue=""
                                        sx={{ flexGrow: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                    >
                                        <MenuItem value="" disabled>
                                            Select Staff
                                        </MenuItem>
                                        {mockStaff.map((staff) => (
                                            <MenuItem key={staff} value={staff}>
                                                {staff}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    <Tooltip title="Assign Staff">
                                        <Button
                                            variant="contained"
                                            startIcon={<PersonAdd />}
                                            sx={{ bgcolor: '#1976d2', color: 'white', '&:hover': { bgcolor: '#115293' } }}
                                        >
                                            Assign
                                        </Button>
                                    </Tooltip>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Unassigned Orders */}
                <Grid item xs={12}>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium', color: '#1976d2' }}>
                                Unassigned Orders
                            </Typography>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Order ID</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Items</TableCell>
                                        {isManager && (
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Actions</TableCell>
                                        )}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockUnassignedOrders.map((order) => (
                                        <TableRow key={order.orderId} sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}>
                                            <TableCell>{order.orderId}</TableCell>
                                            <TableCell>{order.itemsCount}</TableCell>
                                            {isManager && (
                                                <TableCell>
                                                    <Tooltip title="Assign Staff">
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<PersonAdd />}
                                                            sx={{
                                                                color: '#1976d2',
                                                                borderColor: '#1976d2',
                                                                '&:hover': { borderColor: '#115293', bgcolor: '#e0f7fa' },
                                                            }}
                                                        >
                                                            Assign
                                                        </Button>
                                                    </Tooltip>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default OrderPickingDashboard;
