import { use, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import { getProducts, deleteProduct } from '../../../services/inventoryService';
import DataTable from '../../../components/common/DataDisplay/DataTable';
import ProductForm from '../../../components/specific/inventory/ProductForm';

function ProductCatalog() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const allowedRoles = [ROLES.INVENTORY_MANAGER, ROLES.ADMIN];

    useEffect(() => {
        if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
            navigate('/login');
        }
    }, [isAuthenticated]);

    const fetchProducts = async () => {
        try {
            const response = await getProducts();
            setProducts(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load products');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct(id);
                setProducts(products.filter((p) => p._id !== id));
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete product');
            }
        }
    };

    const handleEdit = (product) => {
        setEditProduct(product);
        setShowForm(true);
    };

    const columns = [
        { key: 'name', header: 'Product Name' },
        { key: 'sku', header: 'SKU' },
        { key: 'stockLevel', header: 'Stock Level' },
        { key: 'unitCost', header: 'Unit Cost', render: (product) => `$${product.unitCost.toFixed(2)}` },
        {
            key: 'actions',
            header: 'Actions',
            render: (product) => (
                <div className="space-x-2">
                    <button
                        onClick={() => handleEdit(product)}
                        className="text-primary hover:underline"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => handleDelete(product._id)}
                        className="text-red-500 hover:underline"
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-primary">Product Catalog</h1>
                <button
                    onClick={() => {
                        setEditProduct(null);
                        setShowForm(true);
                    }}
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                    Add Product
                </button>
            </div>
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        {editProduct ? 'Edit Product' : 'Add Product'}
                    </h2>
                    <ProductForm
                        product={editProduct}
                        onSubmit={() => {
                            setShowForm(false);
                            fetchProducts();
                        }}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <DataTable data={products} columns={columns} />
            </div>
        </div>
    );
}

export default ProductCatalog;