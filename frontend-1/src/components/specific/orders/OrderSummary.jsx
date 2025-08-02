import { useState } from 'react';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { createOrder } from '../../../services/orderService';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { Package, MapPin, FileText, Check } from 'lucide-react';

const validationSchema = Yup.object({
    notes: Yup.string(),
});

function OrderSummary({ selectedItems, selectedAddress, onBack }) {
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuthStore();

    // Calculate totals
    const subtotal = selectedItems.reduce((total, item) => {
        return total + (item.unitPrice * item.quantity);
    }, 0);
    
    const taxRate = 0.08; // 8% tax
    const shippingCost = subtotal > 100 ? 0 : 9.99; // Free shipping over $100
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount + shippingCost;

    const handleSubmit = async (values) => {
        if (!selectedAddress) {
            setError('Please select a shipping address');
            return;
        }
        if (selectedItems.length === 0) {
            setError('Please add at least one item to the order');
            return;
        }

        setIsSubmitting(true);
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
                totalAmount: totalAmount,
                subtotal: subtotal,
                taxAmount: taxAmount,
                shippingCost: shippingCost
            };

            const newOrder = await createOrder(orderData);
            
            // Show success message
            alert('Order created successfully!');
            
            // Navigate to orders page
            navigate('/orders');
        } catch (err) {
            console.log(err);
            setError(err.response?.data?.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Order Review</h3>
                </div>

                <div className="space-y-6">
                    {/* Items Summary */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="space-y-3">
                            {selectedItems.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Package className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h5 className="font-medium text-gray-900">{item.name}</h5>
                                            <p className="text-sm text-gray-500">SKU: {item.sku} • Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">${item.unitPrice} × {item.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address Summary */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="text-gray-900 font-medium">{selectedAddress?.street}</p>
                                    <p className="text-gray-600">
                                        {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.zipCode}
                                    </p>
                                    <p className="text-gray-600">{selectedAddress?.country}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="bg-gray-50 rounded-xl p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Order Total</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                                <span className="text-gray-900">${taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Shipping {subtotal > 100 && <span className="text-green-600 text-xs">(Free!)</span>}
                                </span>
                                <span className="text-gray-900">${shippingCost.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-lg font-semibold text-gray-900">Total</span>
                                    <span className="text-xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes and Submit */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <Formik
                    initialValues={{ notes: '' }}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >
                    {() => (
                        <Form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Order Notes (Optional)
                                </label>
                                <Field
                                    as="textarea"
                                    name="notes"
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Add any special instructions or notes for your order..."
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-red-600 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                                >
                                    Back to Shipping
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Creating Order...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Place Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default OrderSummary;