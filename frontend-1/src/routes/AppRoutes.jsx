import { Routes, Route } from 'react-router-dom';
import Login from '../pages/auth/Login/Login';
import Registration from '../pages/auth/Registration/Registration';
import MainDashboard from '../pages/dashboard/MainDashboard/MainDashboard';
import OrderCreation from '../pages/orders/OrderCreation/OrderCreation';
import OrderList from '../pages/orders/OrderList/OrderList';
import OrderDetail from '../pages/orders/OrderDetail/OrderDetail';
import InventoryDashboard from '../pages/inventory/InventoryDashboard/InventoryDashboard';
import ProductCatalog from '../pages/inventory/ProductCatalog/ProductCatalog';
import PickingDashboard from '../pages/warehouse/PickingDashboard/PickingDashboard';
import PickingListDetail from '../pages/warehouse/PickingListDetail/PickingListDetail';
import PackingStation from '../pages/warehouse/PackingStation/PackingStation';
import ShipmentDashboard from '../pages/logistics/ShipmentDashboard/ShipmentDashboard';
import ShipmentDetail from '../pages/logistics/ShipmentDetail/ShipmentDetail';
import PublicTracking from '../pages/logistics/PublicTracking/PublicTracking';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/common/Layout/MainLayout';
import AdminDashboard from '../pages/admin/AdminDashboard/AdminDashboard';
import Index from '../pages/Index';
import { ROLES } from '../utils/constants';

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes without navbar/sidebar */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Registration />} />
      <Route path="/tracking" element={<PublicTracking />} />

      {/* All other routes with MainLayout (navbar + sidebar) */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Index />} />

        {/* Protected routes */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <MainDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/create"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CUSTOMER, ROLES.SALES_MANAGER]}>
              <OrderCreation />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.CUSTOMER, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN]}
            >
              <OrderList />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute
              allowedRoles={[ROLES.CUSTOMER, ROLES.SALES_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.ADMIN]}
            >
              <OrderDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}>
              <InventoryDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory/products"
          element={
            <ProtectedRoute allowedRoles={[ROLES.INVENTORY_MANAGER, ROLES.ADMIN]}>
              <ProductCatalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="warehouse"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN]}>
              <PickingDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="warehouse/picking/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN]}>
              <PickingListDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="warehouse/packing"
          element={
            <ProtectedRoute allowedRoles={[ROLES.WAREHOUSE_MANAGER, ROLES.WAREHOUSE_STAFF, ROLES.ADMIN]}>
              <PackingStation />
            </ProtectedRoute>
          }
        />
        <Route
          path="logistics"
          element={
            <ProtectedRoute allowedRoles={[ROLES.LOGISTICS_MANAGER, ROLES.ADMIN]}>
              <ShipmentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="logistics/shipments/:id"
          element={
            <ProtectedRoute allowedRoles={[ROLES.LOGISTICS_MANAGER, ROLES.ADMIN]}>
              <ShipmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppRoutes;