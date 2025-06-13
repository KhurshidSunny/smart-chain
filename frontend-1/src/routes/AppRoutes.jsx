import { Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login/Login';
import Registration from '../pages/auth/Registration/Registration';
import MainDashboard from '../pages/dashboard/MainDashboard/MainDashboard';
import OrderCreation from '../pages/orders/OrderCreation/OrderCreation';
import ProtectedRoute from './ProtectedRoute';
import NavigationBar from '../components/common/Navigation/NavigationBar';
import { ROLES } from '../utils/constants';

function AppRoutes() {
    return (
        <>
            <NavigationBar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Registration />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <MainDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/orders/create"
                    element={
                        <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.SALES_MANAGER]}>
                            <OrderCreation />
                        </ProtectedRoute>
                    }
                />
                <Route path="/orders" element={<div className="text-center p-4">Orders List (TBD)</div>} />
                <Route path="/" element={<div className="text-center p-4">Welcome to Smart-Chain</div>} />
            </Routes>
        </>
    );
}

export default AppRoutes;