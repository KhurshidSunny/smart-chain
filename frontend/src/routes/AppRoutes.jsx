import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage/LoginPage';
import RegistrationPage from '../pages/auth/RegistrationPage/RegistrationPage';
import MainDashboard from '../pages/dashboard/MainDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home/Home';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route
                path="/dashboard"
                element={
                    <MainDashboard />
                }
            />
            <Route
                path="/admin-dashboard"
                element={
                    <AdminDashboard />
                }
            />
            <Route path="/" element={<LoginPage />} /> {/* Default route */}
        </Routes>
    );
};

export default AppRoutes;