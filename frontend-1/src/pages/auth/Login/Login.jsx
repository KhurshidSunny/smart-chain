import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoginForm from './LoginForm';
import useAuthStore from '../../../stores/authStore';

function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Use useEffect to handle redirect after component mounts
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">
                    <Link to="/" className="hover:underline">Smart-Chain</Link> Login
                </h1>
                <LoginForm />
                <p className="mt-4 text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;