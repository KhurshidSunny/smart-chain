import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../stores/authStore';
import { ROLES } from '../../../utils/constants';
import ProductSelector from '../../../components/specific/orders/ProductSelector';
import AddressSelection from '../../../components/specific/orders/AddressSelection';
import OrderSummary from '../../../components/specific/orders/OrderSummary';
import { ShoppingCart, MapPin, CreditCard, Check } from 'lucide-react';

// Main Order Creation Component
function OrderCreation() {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();

    // Check if user is authenticated and has permission to create orders
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        // Only customers can create orders through this interface
        if (user?.role !== ROLES.CUSTOMER) {
            navigate('/dashboard');
            return;
        }
    }, [isAuthenticated, user, navigate]);

    const steps = [
        { id: 0, title: 'Products', icon: ShoppingCart, color: 'blue' },
        { id: 1, title: 'Shipping', icon: MapPin, color: 'green' },
        { id: 2, title: 'Review', icon: CreditCard, color: 'purple' }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Show loading if still checking authentication
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Order</h1>
                    <p className="text-gray-600">Follow the steps below to place your order</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-between max-w-md mx-auto">
                        {steps.map((step, index) => {
                            const isActive = index === currentStep;
                            const isCompleted = index < currentStep;
                            const StepIcon = step.icon;
                            
                            return (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300
                                        ${isActive ? `bg-${step.color}-600 text-white shadow-lg` : ''}
                                        ${isCompleted ? 'bg-green-600 text-white' : ''}
                                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                                    `}>
                                        {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                                    </div>
                                    <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="max-w-md mx-auto mt-4">
                        <div className="h-2 bg-gray-200 rounded-full">
                            <div 
                                className="h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
                                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Step Content */}
                <div className="transition-all duration-300">
                    {currentStep === 0 && (
                        <ProductSelector
                            selectedItems={selectedItems}
                            onItemsChange={setSelectedItems}
                            onNext={handleNext}
                        />
                    )}
                    
                    {currentStep === 1 && (
                        <AddressSelection
                            selectedAddress={selectedAddress}
                            onAddressChange={setSelectedAddress}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    
                    {currentStep === 2 && (
                        <OrderSummary
                            selectedItems={selectedItems}
                            selectedAddress={selectedAddress}
                            onBack={handleBack}
                        />
                    )}
                </div>

            </div>
        </div>
    );
}

export default OrderCreation;