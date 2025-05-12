import React from 'react';
import { Box, Fade } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import NavigationBar from './components/common/NavigationBar/NavigationBar';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          height: '100%',
          width: '100vw',
          maxWidth: '100%',
          overflow: 'hidden',
          bgcolor: '#f5f5f5',
          boxSizing: 'border-box',
        }}
      >
        <Toaster
          position={{ xs: 'top-center', sm: 'top-right' }}
          reverseOrder={false}
          gutter={8}
          containerStyle={{
            top: { xs: 16, sm: 24 },
            right: { sm: 24 },
          }}
          toastOptions={{
            duration: { xs: 3000, sm: 4000 },
            style: {
              background: '#fff',
              color: '#757575',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              fontSize: { xs: '0.875rem', sm: '1rem' },
              padding: { xs: '8px 16px', sm: '12px 24px' },
              maxWidth: { xs: '90vw', sm: '400px' },
            },
            success: {
              style: { background: '#e3f2fd', color: '#1976d2' },
              iconTheme: { primary: '#1976d2', secondary: '#e3f2fd' },
            },
            error: {
              style: { background: '#ef5350', color: '#fff' },
              iconTheme: { primary: '#fff', secondary: '#ef5350' },
            },
            loading: {
              style: { background: '#bbdefb', color: '#1976d2' },
            },
          }}
        />
        <NavigationBar />
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            maxWidth: '100%',
            bgcolor: '#f5f5f5',
          }}
          role="main"
          aria-label="Main content"
        >
          <AppRoutes />
        </Box>
      </Box>
    </Fade>
  );
};

export default App;