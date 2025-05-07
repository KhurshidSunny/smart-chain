
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import { Add, Delete, PersonAdd, LocationOn } from '@mui/icons-material';

// Mock data for customers, products, and addresses
const mockCustomers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

const mockProducts = [
    { id: '1', name: 'Laptop', category: 'Electronics', price: 999.99, stock: 10 },
    { id: '2', name: 'Mouse', category: 'Accessories', price: 19.99, stock: 50 },
    { id: '3', name: 'Headphones', category: 'Electronics', price: 59.99, stock: 20 },
    { id: '4', name: 'Keyboard', category: 'Accessories', price: 49.99, stock: 30 },
];

const mockAddresses = [
    { id: '1', street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
    { id: '2', street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' },
];

// Mock selected products for order summary (temporary)
const mockSelectedProducts = [
    { id: '1', name: 'Laptop', quantity: 1, price: 999.99 },
    { id: '2', name: 'Mouse', quantity: 2, price: 19.99 },
];

function NewOrder() {
    // State for dialogs (temporary for UI, you'll replace with real state)
    const [openCustomerDialog, setOpenCustomerDialog] = React.useState(false);
    const [openAddressDialog, setOpenAddressDialog] = React.useState(false);

    // Calculate total for order summary
    const totalAmount = mockSelectedProducts.reduce(
        (sum, product) => sum + product.quantity * product.price,
        0
    );

    return (
        <Box sx={{ p: 4, bgcolor: 'background-light', minHeight: 'calc(100vh - 64px)', width: '100%' }}>
            {/* Page Title */}
            <Typography variant="h4" className="text-text-primary font-semibold" gutterBottom>
                Create New Order
            </Typography>
            <Typography variant="h6" color="textSecondary" gutterBottom sx={{ mb: 3 }}>
                Fill in the details to create a new order
            </Typography>

            <Grid container spacing={3}>
                {/* Customer Selection Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Customer Selection
                    </Typography>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            {/* Autocomplete for selecting customer */}
                            <Autocomplete
                                options={mockCustomers}
                                getOptionLabel={(option) => option.name}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Select Customer"
                                        variant="outlined"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderColor: '#757575' } }}
                                    />
                                )}
                                sx={{ mb: 2 }}
                            />
                            {/* Button to open new customer dialog */}
                            <Button
                                variant="outlined"
                                startIcon={<PersonAdd />}
                                onClick={() => setOpenCustomerDialog(true)}
                                sx={{
                                    color: '#757575',
                                    borderColor: '#757575',
                                    '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' },
                                }}
                            >
                                Add New Customer
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Product Search Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Product Search
                    </Typography>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            {/* Search and filter inputs */}
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={8}>
                                    <TextField
                                        label="Search Products"
                                        variant="outlined"
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-root': { borderColor: '#757575' } }}
                                    />
                                </Grid>
                                <Grid item xs={4}>
                                    <Select
                                        label="Category"
                                        defaultValue=""
                                        fullWidth
                                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                                    >
                                        <MenuItem value="">All Categories</MenuItem>
                                        <MenuItem value="Electronics">Electronics</MenuItem>
                                        <MenuItem value="Accessories">Accessories</MenuItem>
                                    </Select>
                                </Grid>
                            </Grid>
                            {/* Product table */}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Category</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Stock</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockProducts.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}
                                        >
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>{product.category}</TableCell>
                                            <TableCell>${product.price.toFixed(2)}</TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell>
                                                <IconButton color="primary" sx={{ color: '#1976d2' }}>
                                                    <Add />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Summary Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Order Summary
                    </Typography>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            {/* Table for selected products */}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Product</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Quantity</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Price</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Total</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#1976d2' }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {mockSelectedProducts.map((product) => (
                                        <TableRow
                                            key={product.id}
                                            sx={{ '&:hover': { bgcolor: '#e0f7fa' } }}
                                        >
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>{product.quantity}</TableCell>
                                            <TableCell>${product.price.toFixed(2)}</TableCell>
                                            <TableCell>${(product.quantity * product.price).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <IconButton sx={{ color: '#d32f2f' }}>
                                                    <Delete />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {/* Total amount */}
                            <Typography variant="h6" sx={{ mt: 2, textAlign: 'right', fontWeight: 'bold', color: '#1976d2' }}>
                                Total: ${totalAmount.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Shipping Address Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="h6" className="text-text-hover" gutterBottom sx={{ fontWeight: 'medium' }}>
                        Shipping Address
                    </Typography>
                    <Card sx={{ backgroundColor: '#e3f2fd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 2 }}>
                        <CardContent>
                            {/* Dropdown for selecting address */}
                            <Select
                                fullWidth
                                displayEmpty
                                renderValue={(selected) => {
                                    if (!selected) return <em>Select Address</em>;
                                    const address = mockAddresses.find((addr) => addr.id === selected);
                                    return `${address.street}, ${address.city}, ${address.state}`;
                                }}
                                sx={{ mb: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                            >
                                <MenuItem disabled value="">
                                    <em>Select Address</em>
                                </MenuItem>
                                {mockAddresses.map((address) => (
                                    <MenuItem key={address.id} value={address.id}>
                                        {`${address.street}, ${address.city}, ${address.state} ${address.zipCode}`}
                                    </MenuItem>
                                ))}
                            </Select>
                            {/* Button to open new address dialog */}
                            <Button
                                variant="outlined"
                                startIcon={<LocationOn />}
                                onClick={() => setOpenAddressDialog(true)}
                                sx={{
                                    color: '#757575',
                                    borderColor: '#757575',
                                    '&:hover': { borderColor: '#616161', bgcolor: '#e0e0e0' },
                                }}
                            >
                                Add New Address
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            variant="contained"
                            sx={{
                                bgcolor: '#1976d2',
                                color: 'white',
                                '&:hover': { bgcolor: '#115293' },
                                px: 4,
                                py: 1,
                            }}
                        >
                            Submit Order
                        </Button>
                    </Box>
                </Grid>
            </Grid>

            {/* Dialog for Adding New Customer */}
            <Dialog open={openCustomerDialog} onClose={() => setOpenCustomerDialog(false)}>
                <DialogTitle sx={{ color: '#1976d2' }}>Add New Customer</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Name"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                    <TextField
                        label="Email"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                    <TextField
                        label="Phone"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenCustomerDialog(false)}
                        sx={{ color: '#757575', '&:hover': { bgcolor: '#e0e0e0' } }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog for Adding New Address */}
            <Dialog open={openAddressDialog} onClose={() => setOpenAddressDialog(false)}>
                <DialogTitle sx={{ color: '#1976d2' }}>Add New Address</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Street"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                    <TextField
                        label="City"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                    <TextField
                        label="State"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                    <TextField
                        label="Zip Code"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                    <TextField
                        label="Country"
                        fullWidth
                        sx={{ mt: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#757575' } }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenAddressDialog(false)}
                        sx={{ color: '#757575', '&:hover': { bgcolor: '#e0e0e0' } }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#115293' } }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default NewOrder;
