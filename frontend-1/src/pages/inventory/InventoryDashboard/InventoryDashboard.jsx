import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getInventorySummary } from '../../../services/inventoryService';
import StockChart from '../../../components/common/DataDisplay/StockChart';

function InventoryDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const allowedRoles = [ROLES.INVENTORY_MANAGER, ROLES.ADMIN];

    useEffect(() => {
        if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
            navigate('/login');
        }
    }, [isAuthenticated])
    // Restrict access to allowed roles

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await getInventorySummary();
                setSummary(response.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load inventory summary');
            }
        };
        fetchSummary();
    }, []);

    if (!summary && !error) return <div className="text-center p-6">Loading...</div>;
    if (error) return <div className="text-red-500 text-center p-6">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Inventory Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    to="/inventory/products"
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 block group"
                >
                    <h2 className="text-xl font-semibold text-gray-700 mb-2 group-hover:text-primary transition-colors duration-200">
                        Total Products
                    </h2>
                    <p className="text-3xl font-bold text-primary">{summary.totalProducts}</p>
                </Link>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Total Stock</h2>
                    <p className="text-3xl font-bold text-primary">{summary.totalStock}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Low Stock Alerts</h2>
                    <p className="text-3xl font-bold text-red-500">{summary.lowStockCount}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Stock Levels</h2>
                <StockChart data={summary.products} />
            </div>
            {summary.lowStockProducts.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Low Stock Products</h2>
                    <ul className="space-y-2">
                        {summary.lowStockProducts.map((product) => (
                            <li key={product._id} className="flex justify-between">
                                <span>{product.name} (SKU: {product.sku})</span>
                                <span className="text-red-500">Stock: {product.stockLevel}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default InventoryDashboard;