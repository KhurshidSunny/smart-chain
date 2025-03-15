import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';
import store from './redux/store';
import theme from './assets/styles/theme';
import AppRoutes from './routes/AppRoutes';
import NavigationBar from './components/common/NavigationBar/NavigationBar';
import { restoreAuth } from './redux/slices/authSlice';

const AppContent = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true); // Track loading state

    useEffect(() => {
        const restoreAuthState = async () => {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            if (token && user) {
                try {
                    const parsedUser = JSON.parse(user);
                    // Simulate an async operation (e.g., token validation if added)
                    dispatch(restoreAuth({ user: parsedUser, token }));
                } catch (error) {
                    console.error('Failed to parse user from localStorage:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                }
            }
            // Mark loading as complete after restoration
            setIsLoading(false);
        };

        restoreAuthState();
    }, [dispatch]);

    // Display loading indicator while restoring state
    if (isLoading) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                }}
            >
                <CircularProgress size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2, color: 'grey.700' }}>
                    Loading Smart-Chain...
                </Typography>
            </Box>
        );
    }

    // Render the app once loading is complete
    return (
        <Box
            component="main"
            sx={{
                minHeight: '100vh',
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <NavigationBar />
            <Box
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    maxWidth: '100vw',
                    overflowX: 'hidden',
                }}
            >
                <AppRoutes />
            </Box>
        </Box>
    );
};

const App = () => {
    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden">
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <BrowserRouter>
                        <AppContent />
                    </BrowserRouter>
                </ThemeProvider>
            </Provider>
        </div>
    );
};

export default App;