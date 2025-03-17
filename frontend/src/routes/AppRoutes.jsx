import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage/LoginPage';
import RegistrationPage from "./../pages/auth/RegistrationPage/RegistrationPage"
import MainDashboard from '../pages/dashboard/MainDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home/Home';
import NotFound from "./../pages/NotFound/NotFound"; // New import

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/dashboard" element={<MainDashboard />} />
            <Route
                path="/admin-dashboard"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<NotFound />} /> {/* Catch-all route for 404 */}
        </Routes>
    );
};

export default AppRoutes;