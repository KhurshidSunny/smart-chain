import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';
import useAuthStore from '../../../stores/authStore';

function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
        navigate('/dashboard');
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">Smart-Chain Login</h1>
                <LoginForm />
                <p className="mt-4 text-center text-gray-600">
                    Don't have an account?{' '}
                    <a href="/register" className="text-primary hover:underline">
                        Register
                    </a>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;