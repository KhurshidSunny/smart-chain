// src/components/specific/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { getAddresses, createAddress } from '../../../services/authService';
import useAuthStore from '../../../stores/authStore';
import AddressModal from './AddressModal';

const Profile = () => {
    const { user } = useAuthStore();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await getAddresses();
            setAddresses(response.data || []);
        } catch (err) {
            setError('Failed to load addresses');
            console.error('Error fetching addresses:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAddress = () => {
        setEditingAddress(null);
        setShowAddressModal(true);
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setShowAddressModal(true);
    };

    const handleAddressSaved = () => {
        setShowAddressModal(false);
        setEditingAddress(null);
        fetchAddresses(); // Refresh the addresses list
    };

    const handleModalClose = () => {
        setShowAddressModal(false);
        setEditingAddress(null);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Customer Profile</h3>
            </div>

            {/* User Information */}
            <div className="mb-8">
                <h4 className="text-lg font-medium text-gray-700 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600">First Name</label>
                        <p className="text-gray-800">{user?.firstName || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Last Name</label>
                        <p className="text-gray-800">{user?.lastName || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-800">{user?.email || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-800">{user?.phone || 'N/A'}</p>
                    </div>
                </div>
            </div>

            {/* Addresses Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-700">Delivery Addresses</h4>
                    <button
                        onClick={handleAddAddress}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200 text-sm"
                    >
                        Add New Address
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {addresses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No addresses found. Add your first delivery address.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addresses.map((address) => (
                            <div
                                key={address._id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-800">
                                            {address.type || 'Home'}
                                        </span>
                                        {address.isDefault && (
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleEditAddress(address)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="text-gray-600 text-sm space-y-1">
                                    <p>{address.street}</p>
                                    <p>
                                        {address.city}, {address.state} {address.zipCode}
                                    </p>
                                    <p>{address.country}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Address Modal */}
            {showAddressModal && (
                <AddressModal
                    address={editingAddress}
                    onSave={handleAddressSaved}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
};

export default Profile;