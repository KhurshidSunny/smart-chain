import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createOrder } from '../../../services/orderService';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';

const validationSchema = Yup.object({
    notes: Yup.string(),
});

function OrderSummary({ selectedItems, selectedAddress }) {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Calculate total
    const totalAmount = selectedItems.reduce((total, item) => {
        return total + (item.unitPrice * item.quantity);
    }, 0);

    const handleSubmit = async (values) => {
        if (!selectedAddress) {
            setError('Please select a shipping address');
            return;
        }
        if (selectedItems.length === 0) {
            setError('Please add at least one item to the order');
            return;
        }

        try {
            // Prepare order data
            const orderData = {
                customerId: user._id,
                items: selectedItems.map(item => ({
                    name: item.name,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })),
                shippingAddress: selectedAddress,
                notes: values.notes,
                totalAmount: totalAmount
            };

            const newOrder = await createOrder(orderData);
            navigate('/orders');
        } catch (err) {
            console.log(err)
            setError(err.response?.data?.message || 'Failed to create order');
        }
    };

    return (
        <div>
            <Formik
                initialValues={{ notes: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">Selected Items</h3>
                            {selectedItems.length > 0 ? (
                                <div>
                                    <ul className="mt-2 space-y-2">
                                        {selectedItems.map((item, index) => (
                                            <li key={index} className="flex justify-between">
                                                <span>{item.name} (x{item.quantity})</span>
                                                <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total:</span>
                                            <span>${totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">No items selected</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-700">Shipping Address</h3>
                            {selectedAddress ? (
                                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                                    <p className="text-gray-700">
                                        {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state},{' '}
                                        {selectedAddress.zipCode}, {selectedAddress.country}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-500">No address selected</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                                Order Notes (Optional)
                            </label>
                            <Field
                                as="textarea"
                                name="notes"
                                rows="3"
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                placeholder="Add any special instructions or notes for your order..."
                            />
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <button
                            type="submit"
                            disabled={isSubmitting || selectedItems.length === 0 || !selectedAddress}
                            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating Order...' : 'Create Order'}
                        </button>
                    </Form>
                )}
            </Formik>
        </div>
    );
}

export default OrderSummary;