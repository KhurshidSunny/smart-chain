import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getProducts } from '../../../services/orderService';
import useAuthStore from '../../../stores/authStore';

const validationSchema = Yup.object({
    productId: Yup.string().required('Please select a product'),
    quantity: Yup.number()
        .min(1, 'Quantity must be at least 1')
        .required('Quantity is required'),
    
});

function ProductSelector({ selectedItems, onItemsChange }) {
    const [products, setProducts] = useState([]);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await getProducts();
                setProducts(response.data);
            } catch (err) {
                setError('Failed to load products');
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

            const newItem = {
                ...values,
                name: product.name,
                unitPrice: product.unitCost
            };

            // Update parent state instead of local state
            onItemsChange([...selectedItems, newItem]);
            resetForm();
            setError(null); // Clear any previous errors
        } catch (err) {
            setError('Failed to add item');
        }
    };

    const handleRemoveItem = (indexToRemove) => {
        const updatedItems = selectedItems.filter((_, index) => index !== indexToRemove);
        onItemsChange(updatedItems);
    };

    return (
        <div>
            <Formik
                initialValues={{ productId: '', quantity: 1 }}
                validationSchema={validationSchema}
                onSubmit={handleAddItem}
            >
                {({ isSubmitting }) => (
                    <Form className="space-y-4">
                        <div>
                            <label htmlFor="productId" className="block text-sm font-medium text-gray-700">
                                Product
                            </label>
                            <Field
                                as="select"
                                name="productId"
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                            >
                                <option value="">Select a product</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                        {product.name} (SKU: {product.sku}, Stock: {product.stockLevel})
                                    </option>
                                ))}
                            </Field>
                            <ErrorMessage name="productId" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                                Quantity
                            </label>
                            <Field
                                type="number"
                                name="quantity"
                                min="1"
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                            />
                            <ErrorMessage name="quantity" component="div" className="text-red-500 text-sm mt-1" />
                        </div>
                        {error && <div className="text-red-500 text-sm">{error}</div>}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        >
                            Add Item
                        </button>
                    </Form>
                )}
            </Formik>
            {selectedItems.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-700">Selected Items</h3>
                    <ul className="mt-2 space-y-2">
                        {selectedItems.map((item, index) => (
                            <li key={index} className="flex justify-between items-center">
                                <span>{item.name} (x{item.quantity})</span>
                                <div className="flex items-center gap-2">
                                    <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(index)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default ProductSelector;