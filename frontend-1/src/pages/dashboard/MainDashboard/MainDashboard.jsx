import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';

function MainDashboard() {
    const { user } = useAuthStore();

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Welcome to Smart-Chain Dashboard</h1>
            <p className="text-gray-700">
                Hello, {user?.firstName || 'User'}! You are logged in as a {user?.roleId || 'Guest'}.
            </p>
            <div className="mt-4">
                {/* Role-based dashboard content will be added later */}
                {user?.roleId === ROLES.CUSTOMER && <p>Your orders and tracking information will appear here.</p>}
                {user?.roleId === ROLES.ADMIN && <p>System administration tools will appear here.</p>}
            </div>
        </div>
    );
}

export default MainDashboard;