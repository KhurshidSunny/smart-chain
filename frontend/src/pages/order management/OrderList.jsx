
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Autocomplete,
    Select,
    MenuItem,
    Button,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Checkbox,
    TablePagination,
    TableSortLabel,
} from '@mui/material';
import { Visibility, Edit, Cancel, FileDownload } from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import StatusIndicator from '../../components/common/StatusIndicator/StatusIndicator.jsx'; // Assumed from your project

// Mock data for orders and customers
const mockOrders = [
    {
        id: '1',
        orderNumber: 'ORD-001',
        customer: 'John Doe',
        date: '2025-03-15',
        total: 1039.97,
        status: 'completed',
    },
    {
        id: '2',
        orderNumber: 'ORD-002',
        customer: 'Jane Smith',
        date: '2025-03-16',
        total: 79.97,
        status: 'inProgress',
    },
    {
        id: '3',
        orderNumber: 'ORD-003',
        customer: 'John Doe',
        date: '2025-03-17',
        total: 59.99,
        status: 'pending',
    },
    {
        id: '4',
        orderNumber: 'ORD-004',
        customer: 'Jane Smith',
        date: '2025-03-18',
        total: 149.99,
        status: 'cancelled',
    },
];

const mockCustomers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
];

function OrderList() {
    // Temporary state for UI (you'll replace with real state)
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);
    const [selectedOrders, setSelectedOrders] = React.useState([]);
    const isStaff = true; // Temporary flag, replace with real role check

    // Handle pagination
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Handle batch selection
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedOrders(mockOrders.map((order) => order.id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOrder = (id) => {
        setSelectedOrders((prev) =>
            prev.includes(id) ? prev.filter((orderId) => orderId !== id) : [...prev, id]
        );
    };

    // Mock sorting (placeholder for UI)
    const handleSort = (column) => {
        console.log(`Sorting by ${column}`);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 4, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
                {/* Page Title */}
                <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                    Order List
                </Typography>
                <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
                    Manage and monitor all orders
                </Typography>

                <Grid container spacing={3}>
                    {/* Filter Controls */}
                    <Grid item xs={12}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                    Filters
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Search */}
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Search Orders"
                                            variant="outlined"
                                            fullWidth
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                        />
                                    </Grid>
                                    {/* Status Filter */}
                                    <Grid item xs={12} sm={2}>
                                        <Select
                                            fullWidth
                                            displayEmpty
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                        >
                                            <MenuItem value="">All Statuses</MenuItem>
                                            <MenuItem value="completed">Completed</MenuItem>
                                            <MenuItem value="inProgress">In Progress</MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </Grid>
                                    {/* Date Range */}
                                    <Grid item xs={12} sm={3}>
                                        <DatePicker
                                            label="Start Date"
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <DatePicker
                                            label="End Date"
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    {/* Customer Filter (Staff Only) */}
                                    {isStaff && (
                                        <Grid item xs={12} sm={4}>
                                            <Autocomplete
                                                options={mockCustomers}
                                                getOptionLabel={(option) => option.name}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Select Customer"
                                                        variant="outlined"
                                                        fullWidth
                                                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                                    />
                                                )}
                                            />
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Batch Actions */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Select
                                disabled={selectedOrders.length === 0}
                                displayEmpty
                                sx={{ mr: 2, width: 200, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                            >
                                <MenuItem value="" disabled>
                                    Batch Actions
                                </MenuItem>
                                <MenuItem value="updateStatus">Update Status</MenuItem>
                                <MenuItem value="export">Export Selected</MenuItem>
                                <MenuItem value="cancel">Cancel Orders</MenuItem>
                            </Select>
                            <Button
                                variant="contained"
                                disabled={selectedOrders.length === 0}
                                sx={{
                                    bgcolor: '#1976d2',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#115293' },
                                }}
                            >
                                Apply
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<FileDownload />}
                                sx={{
                                    ml: 2,
                                    color: '#757575',
                                    borderColor: '#757575',
                                    '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' },
                                }}
                            >
                                Export All
                            </Button>
                        </Box>
                    </Grid>

                    {/* Order Table */}
                    <Grid item xs={12}>
                        <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                            <CardContent>
                                <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                                    Orders
                                </Typography>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedOrders.length === mockOrders.length}
                                                    onChange={handleSelectAll}
                                                    sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                <TableSortLabel onClick={() => handleSort('orderNumber')}>
                                                    Order Number
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                <TableSortLabel onClick={() => handleSort('customer')}>
                                                    Customer
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                <TableSortLabel onClick={() => handleSort('date')}>
                                                    Date
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                <TableSortLabel onClick={() => handleSort('total')}>
                                                    Total
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                <TableSortLabel onClick={() => handleSort('status')}>
                                                    Status
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {mockOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((order) => (
                                            <TableRow
                                                key={order.id}
                                                sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedOrders.includes(order.id)}
                                                        onChange={() => handleSelectOrder(order.id)}
                                                        sx={{ color: '#1976d2', '&.Mui-checked': { color: '#1976d2' } }}
                                                    />
                                                </TableCell>
                                                <TableCell>{order.orderNumber}</TableCell>
                                                <TableCell>{order.customer}</TableCell>
                                                <TableCell>{order.date}</TableCell>
                                                <TableCell>${order.total.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <StatusIndicator status={order.status} />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton sx={{ color: '#1976d2' }} title="View">
                                                        <Visibility />
                                                    </IconButton>
                                                    <IconButton sx={{ color: '#1976d2' }} title="Edit">
                                                        <Edit />
                                                    </IconButton>
                                                    <IconButton sx={{ color: '#d32f2f' }} title="Cancel">
                                                        <Cancel />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {/* Pagination */}
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={mockOrders.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
}

export default OrderList;
