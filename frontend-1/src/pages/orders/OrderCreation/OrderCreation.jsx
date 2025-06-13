import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import ProductSelector from '../../../components/specific/orders/ProductSelector';
import AddressSelection from '../../../components/specific/orders/AddressSelection';
import OrderSummary from '../../../components/specific/orders/OrderSummary';

function OrderCreation() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    // Lift state up to parent component
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    // Restrict access to customers and sales managers
    if (!isAuthenticated || ![ROLES.CUSTOMER, ROLES.SALES_MANAGER].includes(user?.role)) {
        navigate('/login');
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <h1 className="text-3xl font-bold text-primary mb-6">Create Order</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Select Products</h2>
                    <ProductSelector
                        selectedItems={selectedItems}
                        onItemsChange={setSelectedItems}
                    />
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Shipping Address</h2>
                        <AddressSelection
                            selectedAddress={selectedAddress}
                            onAddressChange={setSelectedAddress}
                        />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Order Summary</h2>
                        <OrderSummary
                            selectedItems={selectedItems}
                            selectedAddress={selectedAddress}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderCreation;