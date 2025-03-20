import React from 'react';
import { Toaster } from 'react-hot-toast'; // Import Toaster
import NavigationBar from './components/common/NavigationBar/NavigationBar';
import AppRoutes from './routes/AppRoutes';

const App = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background-light">
            <Toaster
                position="top-right" // Default position, customizable
                toastOptions={{
                    duration: 4000, // 4 seconds default duration
                    style: {
                        background: '#fff',
                        color: '#333',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    },
                    success: {
                        style: { background: '#d4edda', color: '#155724' }, // Green for success
                        iconTheme: { primary: '#155724' },
                    },
                    error: {
                        style: { background: '#f8d7da', color: '#721c24' }, // Red for error
                        iconTheme: { primary: '#721c24' },
                    },
                    loading: {
                        style: { background: '#cce5ff', color: '#004085' }, // Blue for loading
                    },
                }}
            />
            <NavigationBar />
            <main className="flex-grow">
                <AppRoutes />
            </main>
        </div>
    );
};

export default App;