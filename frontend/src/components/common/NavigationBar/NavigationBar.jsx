import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Box,
    Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const NavigationBar = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user } = useSelector((state) => state.auth); // Assuming authSlice manages user state
    const location = useLocation();
    const navigate = useNavigate();

    // Role-based navigation items
    const getNavItems = () => {
        const role = user?.role || 'customer'; // Default to 'customer' if no user
        const commonItems = [
            { text: 'Dashboard', path: '/dashboard', icon: <HomeIcon />, roles: ['all'] },
            { text: 'Orders', path: '/orders', icon: <AssignmentIcon />, roles: ['all'] },
        ];

        const roleSpecificItems = {
            admin: [
                { text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
                { text: 'Warehouse', path: '/warehouse', icon: <LocalShippingIcon /> },
                { text: 'Logistics', path: '/logistics', icon: <LocalShippingIcon /> },
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon /> },
                { text: 'Users', path: '/users', icon: <PeopleIcon /> },
            ],
            warehouse_manager: [
                { text: 'Warehouse', path: '/warehouse', icon: <LocalShippingIcon /> },
                { text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
            ],
            warehouse_staff: [
                { text: 'Warehouse', path: '/warehouse', icon: <LocalShippingIcon /> },
            ],
            inventory_manager: [
                { text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
            ],
            sales_manager: [
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon /> },
            ],
            logistics_manager: [
                { text: 'Logistics', path: '/logistics', icon: <LocalShippingIcon /> },
            ],
            customer_service: [
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon /> },
            ],
            customer: [
                { text: 'Tracking', path: '/tracking', icon: <LocalShippingIcon /> },
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon /> },
            ],
        };

        const items = [...commonItems, ...(roleSpecificItems[role] || [])];
        return items.filter(
            (item) => item.roles.includes('all') || item.roles.includes(role)
        );
    };

    const navItems = getNavItems();

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const handleLogout = () => {
        // TODO: Dispatch logout action and redirect to login
        navigate('/login');
    };

    const drawerContent = (
        <Box sx={{ width: 250 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
                Smart-Chain
            </Typography>
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            bgcolor: location.pathname === item.path ? 'grey.200' : 'inherit',
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
                {user && (
                    <ListItem button onClick={handleLogout}>
                        <ListItemIcon><ExitToAppIcon /></ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItem>
                )}
            </List>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }} // Hidden on larger screens
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Smart-Chain
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {navItems.map((item) => (
                            <Button
                                key={item.text}
                                color="inherit"
                                onClick={() => handleNavigation(item.path)}
                                sx={{
                                    mx: 1,
                                    borderBottom:
                                        location.pathname === item.path ? '2px solid white' : 'none',
                                }}
                            >
                                {item.text}
                            </Button>
                        ))}
                        {user && (
                            <Button color="inherit" onClick={handleLogout}>
                                Logout
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={handleDrawerToggle}
                sx={{ display: { xs: 'block', sm: 'none' } }} // Visible only on mobile
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default NavigationBar;