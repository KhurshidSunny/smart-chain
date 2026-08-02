import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import useFeedbackStore from '../../../stores/feedbackStore';
import { ROLES } from '../../../utils/constants';
import { getProducts, deleteProduct } from '../../../services/inventoryService';
import DataTable from '../../../components/common/DataDisplay/DataTable';
import ProductForm from '../../../components/specific/inventory/ProductForm';
import ConfirmationModal from '../../../components/common/ConfirmationModal/ConfirmationModal';

function ProductCatalog() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const showSuccess = useFeedbackStore((state) => state.showSuccess);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
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

    const handleDeleteRequest = (product) => {
        setProductToDelete(product);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;

        try {
            await deleteProduct(productToDelete._id);
            setProducts((current) => current.filter((p) => p._id !== productToDelete._id));
            setProductToDelete(null);
            showSuccess(
                'Product deleted',
                `${productToDelete.name} was removed from the catalog.`
            );
        } catch (err) {
            setProductToDelete(null);
            setError(err.response?.data?.message || 'Failed to delete product');
        }
    };

    const handleEdit = (product) => {
        setEditProduct(product);
        setShowForm(true);
    };

    const handleFormSubmit = (action) => {
        setShowForm(false);
        setEditProduct(null);
        fetchProducts();
        showSuccess(
            action === 'update' ? 'Product updated' : 'Product created',
            action === 'update'
                ? 'Your product changes were saved successfully.'
                : 'The new product was added to the catalog.'
        );
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
                        onClick={() => handleDeleteRequest(product)}
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
                        onSubmit={handleFormSubmit}
                        onCancel={() => setShowForm(false)}
                    />
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <DataTable data={products} columns={columns} />
            </div>

            <ConfirmationModal
                isOpen={Boolean(productToDelete)}
                title="Delete product?"
                message={
                    productToDelete
                        ? `Are you sure you want to delete "${productToDelete.name}"? This cannot be undone.`
                        : ''
                }
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setProductToDelete(null)}
            />
        </div>
    );
}

export default ProductCatalog;
