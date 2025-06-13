import { Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;