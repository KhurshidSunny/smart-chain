// Updated NavigationBar.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';

// Simple SVG Icon
const Bars3Icon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

function NavigationBar({ onToggleSidebar }) {
    const { user, isAuthenticated, logout } = useAuthStore();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        console.log(user)
    }, [])

    return (
        <nav className="bg-primary text-white p-4 sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    {isAuthenticated && (
                        <button
                            onClick={onToggleSidebar}
                            className="md:hidden p-1 hover:bg-blue-600 rounded transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <Bars3Icon className="w-6 h-6" />
                        </button>
                    )}
                    <Link to="/" className="text-xl font-bold hover:text-gray-200 transition-colors">
                        Smart-Chain
                    </Link>
                </div>

                {/* Mobile menu button for non-authenticated users */}
                {!isAuthenticated && (
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="focus:outline-none p-1 hover:bg-blue-600 rounded transition-colors"
                            aria-label="Toggle menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Right side content */}
                <div className={`flex items-center space-x-4 ${!isAuthenticated && isMenuOpen
                        ? 'block absolute top-16 left-0 right-0 bg-primary p-4 shadow-lg z-40 md:relative md:top-0 md:p-0 md:shadow-none'
                        : !isAuthenticated && !isMenuOpen
                            ? 'hidden md:flex'
                            : 'flex'
                    }`}>
                    {isAuthenticated ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-sm hidden md:inline">
                                Welcome, {user?.firstName || user?.name || 'User'}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                disabled={isLoggingOut}
                            >
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-gray-200 px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                                Login
                            </Link>
                            <Link to="/register" className="hover:text-gray-200 px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavigationBar;