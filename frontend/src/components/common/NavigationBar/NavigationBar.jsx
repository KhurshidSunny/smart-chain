// src/components/common/NavigationBar/NavigationBar.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FeedbackIcon from '@mui/icons-material/Feedback';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';

const NavigationBar = () => {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const user = useSelector((state) => state.auth.user); // Assuming auth slice exists
    const navigate = useNavigate();

    const menuItems = [
        { text: 'Dashboard', icon: <HomeIcon />, path: '/dashboard', roles: ['all'] },
        { text: 'Orders', icon: <ShoppingCartIcon />, path: '/orders', roles: ['admin', 'sales', 'warehouse', 'logistics', 'customer_service'] },
        { text: 'Inventory', icon: <InventoryIcon />, path: '/inventory', roles: ['admin', 'inventory', 'warehouse'] },
        { text: 'Warehouse', icon: <WarehouseIcon />, path: '/warehouse', roles: ['admin', 'warehouse'] },
        { text: 'Logistics', icon: <LocalShippingIcon />, path: '/logistics', roles: ['admin', 'logistics'] },
        { text: 'Feedback', icon: <FeedbackIcon />, path: '/feedback', roles: ['admin', 'customer_service', 'sales'] },
        { text: 'Users', icon: <PeopleIcon />, path: '/users', roles: ['admin'] },
    ];

    const filteredMenuItems = menuItems.filter(
        (item) => item.roles.includes('all') || (user && item.roles.includes(user.role))
    );

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setDrawerOpen(false);
    };

    const drawerContent = (
        <Box sx={{ width: 250 }} role="presentation">
            <List>
                {filteredMenuItems.map((item) => (
                    <ListItem button key={item.text} onClick={() => handleNavigation(item.path)}>
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Order Tracking System
                    </Typography>
                    {user && (
                        <Typography variant="subtitle1">
                            {user.username} ({user.role})
                        </Typography>
                    )}
                </Toolbar>
            </AppBar>
            <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default NavigationBar;