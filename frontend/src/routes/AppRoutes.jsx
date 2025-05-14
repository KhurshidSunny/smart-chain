import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage/LoginPage';
import RegistrationPage from "./../pages/auth/RegistrationPage/RegistrationPage"
import MainDashboard from '../pages/dashboard/MainDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard/AdminDashboard';
import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home/Home';
import NotFound from "./../pages/NotFound/NotFound"; // New import
import NewOrder from '../pages/order management/NewOrder';
import OrderList from '../pages/order management/OrderList';
import OrderDetail from '../pages/order management/OrderDetail';
import ProductCatalog from '../pages/inventory management/ProductCatalog';
import InventoryDashboard from '../pages/inventory management/InventoryDashboard';
import ProductDetail from '../pages/inventory management/ProductDetail';
import OrderPickingDashboard from '../pages/warehouse management/OrderPickingDashboard';
import PickingListDetail from '../pages/warehouse management/PickingListDetail';
import ManageOrderPacking from '../pages/warehouse management/ManageOrderPacking';
import ShipmentDashboard from '../pages/logistic management/ShipmentDashboard';
import ShipmentDetail from '../pages/logistic management/ShipmentDetail';
import CustomerTracking from '../pages/logistic management/CustomerTracking';
import FeedbackDashboard from '../pages/feedback management/FeedbackDashboard';
import FeedbackDetail from '../pages/feedback management/FeedbackDetail';
import Users from '../pages/user management/Users';
import UserDetail from '../pages/user management/UserDetail';

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
            {/* <Route path="/admin-dashboard" element={<AdminDashboard />}  /> */}

            {/* Order management routes  */}
            <Route path="/orders" element={<OrderList />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path='/orders/:id' element={<OrderDetail />} />

            {/* inventory management routes  */}
            <Route path='/inventory' element={<InventoryDashboard />} />
            <Route path="/product-catalog" element={<ProductCatalog />} />
            <Route path='/products/:id' element={<ProductDetail />} />

            {/* warehouse management routes */}
            <Route path='/warehouse' element={<OrderPickingDashboard />} />
            <Route path='/picking/:orderId' element={<PickingListDetail />} />
            <Route path='/pack' element={<ManageOrderPacking />} />


            {/* Logistic management routes  */}
            <Route path='/logistics' element={<ShipmentDashboard />} />
            <Route path='/logistics/:shipmentId' element={<ShipmentDetail />} />
            <Route path='/track' element={<CustomerTracking />} />


            {/* Feedback Mangement  */}
            <Route path='/feedback' element={<FeedbackDashboard />} />
            <Route path='/feedback/:feedbackId' element={<FeedbackDetail />} />


            {/* User management  */}
            <Route path='/users' element={<Users />} />
            <Route path='/users/:userId' element={<UserDetail />} />

            <Route path="*" element={<NotFound />} /> {/* Catch-all route for 404 */}
        </Routes>
    );
};

export default AppRoutes;