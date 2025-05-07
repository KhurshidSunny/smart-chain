
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Fade,
    Link,
} from '@mui/material';
import { SentimentDissatisfied, Home, Dashboard, Email } from '@mui/icons-material';
import ActionButton from '../../components/common/ActionButton/ActionButton';

const NotFound = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleGoHome = () => {
        navigate('/');
    };

    const handleGoDashboard = () => {
        navigate('/dashboard'); // Adjust to your main dashboard route
    };

    const handleContactSupport = () => {
        window.location.href = 'mailto:support@gmail.com';  // we will add our email here
    };

    return (
        <Box
            sx={{
                width: '100vw', 
                maxWidth: '100%', // Prevent overflow
                minHeight: 'calc(100vh - 64px)', 
                bgcolor: 'background-light', 
                m: 0,
                p: 0, 
                boxSizing: 'border-box', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Fade in timeout={600}>
                <Box
                    sx={{
                        px: { xs: 2, sm: 4 }, 
                        py: 4,
                        maxWidth: '800px', 
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {/* Illustration */}
                    <SentimentDissatisfied
                        sx={{
                            fontSize: { xs: '4rem', md: '6rem' },
                            color: '#1976d2',
                            mb: 2,
                        }}
                    />

                    {/* Error Code */}
                    <Typography
                        variant="h1"
                        component="h1"
                        sx={{
                            fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
                            color: '#1976d2', // text-primary
                            fontWeight: 'bold',
                            mb: 2,
                        }}
                    >
                        404 - Page Not Found
                    </Typography>

                    {/* Dynamic Error Message */}
                    <Typography
                        variant="h5"
                        sx={{
                            color: '#757575', 
                            mb: 2,
                            maxWidth: '600px',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                        }}
                    >
                        Oops! The page <strong>{location.pathname}</strong> doesn’t exist or has been moved.
                    </Typography>

                    {/* Explanation */}
                    <Typography
                        variant="body1"
                        sx={{
                            color: '#9e9e9e', 
                            mb: 4,
                            maxWidth: '600px',
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                    >
                        A 404 error means we couldn’t find the page you’re looking for. Let’s get you back on track!
                    </Typography>

                    {/* Navigation Buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            mb: 3,
                            width: { xs: '100%', sm: 'auto' },
                        }}
                    >
                        <ActionButton
                            label="Return to Home"
                            onClick={handleGoHome}
                            variant="contained"
                            startIcon={<Home />}
                            sx={{
                                bgcolor: '#1976d2', 
                                '&:hover': { bgcolor: '#115293' },
                                px: 4,
                                py: 1.5,
                                width: { xs: '100%', sm: 'auto' },
                            }}
                        />
                        <ActionButton
                            label="Go to Dashboard"
                            onClick={handleGoDashboard}
                            variant="outlined"
                            startIcon={<Dashboard />}
                            sx={{
                                color: '#1976d2',
                                borderColor: '#1976d2',
                                '&:hover': {
                                    bgcolor: '#e0f7fa',
                                    borderColor: '#115293',
                                },
                                px: 4,
                                py: 1.5,
                                width: { xs: '100%', sm: 'auto' },
                            }}
                        />
                    </Box>

                    {/* Support Link */}
                    <Typography
                        variant="body2"
                        sx={{ color: '#757575', fontSize: { xs: '0.85rem', sm: '0.9rem' } }}
                    >
                        Still lost?{' '}
                        <Link
                            href="#"
                            onClick={handleContactSupport}
                            sx={{
                                color: '#1976d2',
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            Contact Support <Email fontSize="small" sx={{ verticalAlign: 'middle' }} />
                        </Link>
                    </Typography>
                </Box>
            </Fade>
        </Box>
    );
};

export default NotFound;