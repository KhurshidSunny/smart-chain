import { useNavigate, Link } from 'react-router-dom';
import RegistrationForm from './RegistrationForm';
import useAuthStore from '../../../stores/authStore';

function RegistrationPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
        navigate('/dashboard');
    }   

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-primary mb-6 text-center">
                    <Link to="/" className="hover:underline">Smart-Chain</Link> Registration
                </h1>
                <RegistrationForm />
                <p className="mt-4 text-center text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegistrationPage;