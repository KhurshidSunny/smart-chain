import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { Box } from '@mui/material';
import store from './redux/store';
import theme from './assets/styles/theme';
import AppRoutes from './routes/AppRoutes';
import NavigationBar from './components/common/NavigationBar/NavigationBar';

const App = () => {
    return (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden"> {/* Reinforced root overflow protection */}
            <Provider store={store}>
                <ThemeProvider theme={theme}>
                    <BrowserRouter>
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
                    </BrowserRouter>
                </ThemeProvider>
            </Provider>
        </div>
    );
};

export default App;