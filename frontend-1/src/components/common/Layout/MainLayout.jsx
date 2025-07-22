// components/common/Layout/MainLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import NavigationBar from '../Navigation/NavigationBar';
import Sidebar from '../Navigation/Sidebar';
import useAuthStore from '../../../stores/authStore';

function MainLayout() {
    const { isAuthenticated } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Close sidebar on mobile by default
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) { // mobile breakpoint
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };

        // Set initial state
        handleResize();

        // Listen for resize events
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Fixed Navigation Bar */}
            <NavigationBar onToggleSidebar={toggleSidebar} />

            <div className="flex h-[calc(100vh-4rem)]"> {/* Subtract navbar height */}
                {/* Sidebar - only show if authenticated */}
                {isAuthenticated && (
                    <Sidebar
                        isOpen={sidebarOpen}
                        onToggle={toggleSidebar}
                    />
                )}

                {/* Main Content Area */}
                <main className={`
                    flex-1 overflow-y-auto
                    ${isAuthenticated && sidebarOpen ? 'md:ml-0' : ''}
                    ${isAuthenticated && !sidebarOpen ? 'md:ml-0' : ''}
                    transition-all duration-300 ease-in-out
                `}>
                    <div className="container mx-auto px-4 py-6 min-h-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

export default MainLayout;