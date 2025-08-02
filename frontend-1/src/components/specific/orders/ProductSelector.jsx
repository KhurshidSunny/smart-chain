import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getProducts } from '../../../services/orderService';
import useAuthStore from '../../../stores/authStore';
import { Package, Plus, X } from 'lucide-react';

const validationSchema = Yup.object({
    productId: Yup.string().required('Please select a product'),
    quantity: Yup.number()
        .min(1, 'Quantity must be at least 1')
        .required('Quantity is required'),
});

function ProductSelector({ selectedItems, onItemsChange, onNext }) {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await getProducts();
                setProducts(response.data);
            } catch (err) {
                setError('Failed to load products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const handleAddItem = async (values, { resetForm }) => {
        try {
            const product = products.find((p) => p._id === values.productId);
            if (product.stockLevel < values.quantity) {
                setError(`Only ${product.stockLevel} units available for ${product.name}`);
                return;
            }

            const existingItemIndex = selectedItems.findIndex(item => item.productId === values.productId);
            
            if (existingItemIndex >= 0) {
                const updatedItems = [...selectedItems];
                updatedItems[existingItemIndex].quantity += parseInt(values.quantity);
                onItemsChange(updatedItems);
            } else {
                const newItem = {
                    ...values,
                    quantity: parseInt(values.quantity),
                    name: product.name,
                    unitPrice: product.unitCost,
                    sku: product.sku
                };
                onItemsChange([...selectedItems, newItem]);
            }

            resetForm();
            setSelectedProduct(null);
            setError(null);
        } catch (err) {
            setError('Failed to add item');
        }
    };

    const handleRemoveItem = (indexToRemove) => {
        const updatedItems = selectedItems.filter((_, index) => index !== indexToRemove);
        onItemsChange(updatedItems);
    };

    const handleProductChange = (productId, setFieldValue) => {
        setFieldValue('productId', productId);
        const product = products.find(p => p._id === productId);
        setSelectedProduct(product);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Add Products</h3>
                </div>

                <Formik
                    initialValues={{ productId: '', quantity: 1 }}
                    validationSchema={validationSchema}
                    onSubmit={handleAddItem}
                >
                    {({ values, setFieldValue, isSubmitting }) => (
                        <Form className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Product
                                    </label>
                                    <Field
                                        as="select"
                                        name="productId"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                        onChange={(e) => handleProductChange(e.target.value, setFieldValue)}
                                    >
                                        <option value="">Choose a product...</option>
                                        {products.map((product) => (
                                            <option key={product._id} value={product._id}>
                                                {product.name} (SKU: {product.sku})
                                            </option>
                                        ))}
                                    </Field>
                                    <ErrorMessage name="productId" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity
                                    </label>
                                    <Field
                                        type="number"
                                        name="quantity"
                                        min="1"
                                        max={selectedProduct?.stockLevel || 999}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                            </div>

                            {selectedProduct && (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                                            <p className="text-sm text-gray-500">Stock available: {selectedProduct.stockLevel}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-semibold text-gray-900">${selectedProduct.unitCost}</p>
                                            <p className="text-sm text-gray-500">per unit</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add to Order
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>

            {selectedItems.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Selected Items ({selectedItems.length})</h4>
                    <div className="space-y-3">
                        {selectedItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{item.name}</h5>
                                    <p className="text-sm text-gray-500">SKU: {item.sku} • Quantity: {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">${item.unitPrice} × {item.quantity}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
                            <span className="text-xl font-bold text-blue-600">
                                ${selectedItems.reduce((total, item) => total + (item.unitPrice * item.quantity), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onNext}
                        className="w-full mt-6 bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                        Continue to Shipping
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ProductSelector;