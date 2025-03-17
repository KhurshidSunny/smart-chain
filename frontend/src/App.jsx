import React from 'react';
import NavigationBar from './components/common/NavigationBar/NavigationBar';
import AppRoutes from './routes/AppRoutes';

const App = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background-light">
            <NavigationBar />
            <main className="flex-grow">
                <AppRoutes />
            </main>
        </div>
    );
};

export default App;