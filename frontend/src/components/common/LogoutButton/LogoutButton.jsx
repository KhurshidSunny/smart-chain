import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { logoutUser } from '../../../services/authService';

const LogoutButton = ({ variant = 'contained', color = 'secondary', sx }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.removeQueries(['authUser']);
            navigate('/login');
        },
    });

    const handleLogout = () => {
        logoutMutation.mutate();
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