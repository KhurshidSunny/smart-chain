import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';

function NavigationBar() {
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
            // Even if logout fails, still redirect to login
            navigate('/login');
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <nav className="bg-primary text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">Smart-Chain</Link>
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="focus:outline-none"
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
                <div className={`md:flex items-center space-x-4 ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="hover:text-gray-200">Dashboard</Link>
                            {user?.roleId === ROLES.ADMIN && (
                                <Link to="/admin" className="hover:text-gray-200">Admin</Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="hover:text-gray-200"
                                disabled={isLoggingOut}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="hover:text-gray-200">Login</Link>
                            <Link to="/register" className="hover:text-gray-200">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavigationBar;