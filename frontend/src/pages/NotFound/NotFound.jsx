import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ActionButton from '../../components/common/ActionButton/ActionButton';

const NotFound = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <Box
            sx={{
                minHeight: 'calc(100vh - 64px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background-light',
                px: 2,
                textAlign: 'center',
            }}
        >
            <Typography
                variant="h1"
                component="h1"
                sx={{ fontSize: { xs: '3rem', md: '6rem' }, color: 'text-primary', mb: 2 }}
            >
                404
            </Typography>
            <Typography
                variant="h5"
                sx={{ color: 'text-secondary', mb: 3, maxWidth: '600px' }}
            >
                Oops! It looks like you’ve wandered off the path. The page you’re looking for doesn’t exist or has moved.
            </Typography>
            <Typography
                variant="body1"
                sx={{ color: 'text-muted', mb: 4, maxWidth: '600px' }}
            >
                Don’t worry, let’s get you back to safety!
            </Typography>
            <ActionButton
                label="Return to Home"
                onClick={handleGoHome}
                variant="contained"
                sx={{
                    bgcolor: 'primary',
                    '&:hover': { bgcolor: 'primary-dark' },
                    px: 4,
                    py: 1.5,
                }}
            />
        </Box>
    );
};

export default NotFound;