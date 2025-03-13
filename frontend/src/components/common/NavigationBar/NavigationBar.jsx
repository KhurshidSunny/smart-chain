import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
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
import { logout } from '../../../redux/slices/authSlice';
import SearchBar from '../../../components/common/SearchBar/SearchBar';

/**
 * NavigationBar Component
 * 
 * A responsive navigation bar for the Smart-Chain application, providing role-based navigation links,
 * a search functionality, and logout option. It features a hamburger menu with search for mobile views
 * and a horizontal layout for desktop views where the search bar is next to the logo, and navigation
 * buttons are aligned to the far right, filling leftward.
 */

const NavigationBar = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { user } = useAppSelector((state) => state.auth);
    const dispatch = useAppDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const getNavItems = () => {
        const role = user?.role || '';
        const commonItems = [
            { text: 'Dashboard', path: '/dashboard', icon: <HomeIcon />, roles: ['all'] },
            { text: 'Orders', path: '/orders', icon: <AssignmentIcon />, roles: ['all'] },
        ];

        const roleSpecificItems = {
            admin: [
                { text: 'Inventory', path: '/inventory', icon: <InventoryIcon />, roles: ['admin', 'inventory_manager', 'warehouse_manager'] },
                { text: 'Warehouse', path: '/warehouse', icon: <LocalShippingIcon />, roles: ['admin', 'warehouse_manager', 'warehouse_staff'] },
                { text: 'Logistics', path: '/logistics', icon: <LocalShippingIcon />, roles: ['admin', 'logistics_manager'] },
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon />, roles: ['admin', 'sales_manager', 'customer_service', 'customer'] },
                { text: 'Users', path: '/users', icon: <PeopleIcon />, roles: ['admin'] },
            ],
            warehouse_manager: [
                { text: 'Warehouse', path: '/warehouse', icon: <LocalShippingIcon />, roles: ['warehouse_manager', 'admin', 'warehouse_staff'] },
                { text: 'Inventory', path: '/inventory', icon: <InventoryIcon />, roles: ['warehouse_manager', 'admin', 'inventory_manager'] },
            ],
            warehouse_staff: [
                { text: 'Warehouse', path: '/warehouse', icon: <LocalShippingIcon />, roles: ['warehouse_staff', 'admin', 'warehouse_manager'] },
            ],
            inventory_manager: [
                { text: 'Inventory', path: '/inventory', icon: <InventoryIcon />, roles: ['inventory_manager', 'admin', 'warehouse_manager'] },
            ],
            sales_manager: [
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon />, roles: ['sales_manager', 'admin', 'customer_service', 'customer'] },
            ],
            logistics_manager: [
                { text: 'Logistics', path: '/logistics', icon: <LocalShippingIcon />, roles: ['logistics_manager', 'admin'] },
            ],
            customer_service: [
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon />, roles: ['customer_service', 'admin', 'sales_manager', 'customer'] },
            ],
            customer: [
                { text: 'Tracking', path: '/tracking', icon: <LocalShippingIcon />, roles: ['customer'] },
                { text: 'Feedback', path: '/feedback', icon: <FeedbackIcon />, roles: ['customer', 'admin', 'sales_manager', 'customer_service'] },
            ],
        };

        const items = [...commonItems, ...(roleSpecificItems[role] || [])];
        return items.filter(
            (item) => item.roles?.includes('all') || item.roles?.includes(role)
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
        dispatch(logout());
        navigate('/login');
    };

    const handleSearch = (query) => {
        navigate(`/search?q=${encodeURIComponent(query)}`);
        setDrawerOpen(false); // Close drawer on search in mobile
    };

    const drawerContent = (
        <Box sx={{ width: 250, maxWidth: '100vw' }}>
            <Typography variant="h6" sx={{ p: 2 }}>
                Smart-Chain
            </Typography>
            <Box sx={{ p: 2 }}>
                <SearchBar onSearch={handleSearch} placeholder="Search..." />
            </Box>
            <Divider />
            <List>
                {navItems.map((item) => (
                    <ListItem
                        key={item.text}
                        onClick={() => handleNavigation(item.path)}
                        selected={location.pathname === item.path}
                        sx={{
                            bgcolor: location.pathname === item.path ? 'grey.200' : 'inherit',
                            cursor: 'pointer',
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
                {user && (
                    <ListItem onClick={handleLogout} sx={{ cursor: 'pointer' }}>
                        <ListItemIcon>
                            <ExitToAppIcon />
                        </ListItemIcon>
                        <ListItemText primary="Logout" />
                    </ListItem>
                )}
            </List>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1, width: '100%', maxWidth: '100vw' }}>
            <AppBar position="static" sx={{ width: '100%', maxWidth: '100vw' }}>
                <Toolbar sx={{ flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {/* Left Section: Menu, Title, and Search */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 0 }}>
                            Smart-Chain
                        </Typography>
                        <Box sx={{ display: { xs: 'none', sm: 'block' }, minWidth: 200, maxWidth: 300 }}>
                            <SearchBar onSearch={handleSearch} placeholder="Search..." />
                        </Box>
                    </Box>

                    {/* Right Section: Navigation Links and Logout (Desktop) */}
                    <Box
                        sx={{
                            display: { xs: 'none', sm: 'flex' },
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            justifyContent: 'flex-end',
                        }}
                    >
                        {user && (
                            <Button color="inherit" onClick={handleLogout} sx={{ mx: 1 }}>
                                Logout
                            </Button>
                        )}
                        {navItems.map((item) => (
                            <Button
                                key={item.text}
                                color="inherit"
                                onClick={() => handleNavigation(item.path)}
                                sx={{
                                    mx: 1,
                                    borderBottom:
                                        location.pathname === item.path ? '2px solid white' : 'none',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {item.text}
                            </Button>
                        ))}
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                anchor="left"
                open={drawerOpen}
                onClose={handleDrawerToggle}
                sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: '250px', maxWidth: '100vw' } }}
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default NavigationBar;