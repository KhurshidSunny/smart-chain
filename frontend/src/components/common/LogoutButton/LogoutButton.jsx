import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { logoutUser } from '../../../services/authService';

/**
 * LogoutButton Component
 * - Reusable button to log out the user
 * - Calls logoutUser from authService to handle Redux, localStorage, and navigation
 */
const LogoutButton = ({ variant = 'contained', color = 'secondary', sx }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutUser(dispatch, navigate);
    };

    return (
        <Button
            variant={variant}
            color={color}
            startIcon={<ExitToAppIcon />}
            onClick={handleLogout}
            sx={sx}
        >
            Logout
        </Button>
    );
};

export default LogoutButton;