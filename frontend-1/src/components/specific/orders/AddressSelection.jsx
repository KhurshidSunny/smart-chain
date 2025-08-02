import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getAddresses, createAddress } from '../../../services/authService';
import useAuthStore from '../../../stores/authStore';
import { MapPin } from 'lucide-react';

const validationSchema = Yup.object({
    addressId: Yup.string().required('Please select or add an address'),
    street: Yup.string().when('addressId', {
        is: 'new',
        then: (schema) => schema.required('Street is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    city: Yup.string().when('addressId', {
        is: 'new',
        then: (schema) => schema.required('City is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    state: Yup.string().when('addressId', {
        is: 'new',
        then: (schema) => schema.required('State is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    zipCode: Yup.string().when('addressId', {
        is: 'new',
        then: (schema) => schema.required('Zip code is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
    country: Yup.string().when('addressId', {
        is: 'new',
        then: (schema) => schema.required('Country is required'),
        otherwise: (schema) => schema.notRequired(),
    }),
});

function AddressSelection({ selectedAddress, onAddressChange, onNext, onBack }) {
    const [addresses, setAddresses] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasAddresses, setHasAddresses] = useState(false);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                setLoading(true);
                const response = await getAddresses();
                const addressData = response.data || [];
                setAddresses(addressData);
                setHasAddresses(addressData.length > 0);
            } catch (err) {
                // Don't show error when no addresses exist, just set empty state
                setAddresses([]);
                setHasAddresses(false);
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, []);

    const handleAddressSelection = (addressId, setFieldValue) => {
        setFieldValue('addressId', addressId);

        if (addressId && addressId !== 'new') {
            const address = addresses.find(addr => addr._id === addressId);
            if (address) {
                onAddressChange(address);
            }
        } else {
            onAddressChange(null);
        }

        if (addressId !== 'new') {
            setFieldValue('street', '');
            setFieldValue('city', '');
            setFieldValue('state', '');
            setFieldValue('zipCode', '');
            setFieldValue('country', '');
        }
    };

    const handleAddAddress = async (values, { resetForm, setFieldValue }) => {
        if (values.addressId === 'new') {
            try {
                const { addressId, ...addressData } = values;
                const response = await createAddress(addressData);

                // Refresh addresses list
                const addressesResponse = await getAddresses();
                const newAddresses = addressesResponse.data || [];
                setAddresses(newAddresses);
                setHasAddresses(newAddresses.length > 0);

                // Set the newly created address as selected
                const newAddress = response.data;
                onAddressChange(newAddress);

                // Reset form and set the new address as selected
                resetForm();
                setFieldValue('addressId', newAddress._id);

                setError(null);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to add address');
            }
        }
    };

    const handleAddNewAddress = (setFieldValue) => {
        setFieldValue('addressId', 'new');
        onAddressChange(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Shipping Address</h3>
                </div>

                {!hasAddresses ? (
                    // No addresses available - show add new address form directly
                    <div className="text-center py-8">
                        <div className="bg-blue-50 rounded-xl p-6 mb-4">
                            <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                            <h4 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h4>
                            <p className="text-gray-600 mb-4">You haven't added any shipping addresses yet. Add your first address to continue.</p>
                        </div>

                        <Formik
                            initialValues={{
                                addressId: 'new',
                                street: '',
                                city: '',
                                state: '',
                                zipCode: '',
                                country: '',
                            }}
                            validationSchema={validationSchema}
                            onSubmit={handleAddAddress}
                        >
                            {({ isSubmitting }) => (
                                <Form>
                                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                        <h4 className="font-medium text-gray-900 mb-4">Add Your Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                                <Field
                                                    type="text"
                                                    name="street"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="123 Main Street"
                                                />
                                                <ErrorMessage name="street" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                <Field
                                                    type="text"
                                                    name="city"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="New York"
                                                />
                                                <ErrorMessage name="city" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                                <Field
                                                    type="text"
                                                    name="state"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="NY"
                                                />
                                                <ErrorMessage name="state" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                                <Field
                                                    type="text"
                                                    name="zipCode"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="10001"
                                                />
                                                <ErrorMessage name="zipCode" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                                <Field
                                                    type="text"
                                                    name="country"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="USA"
                                                />
                                                <ErrorMessage name="country" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
                                        >
                                            {isSubmitting ? 'Adding Address...' : 'Add Address'}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                                            <p className="text-red-600 text-sm">{error}</p>
                                        </div>
                                    )}
                                </Form>
                            )}
                        </Formik>
                    </div>
                ) : (
                    // Has addresses - show dropdown selection
                    <Formik
                        initialValues={{
                            addressId: selectedAddress?._id || '',
                            street: '',
                            city: '',
                            state: '',
                            zipCode: '',
                            country: '',
                        }}
                        validationSchema={validationSchema}
                        onSubmit={handleAddAddress}
                        enableReinitialize
                    >
                        {({ values, setFieldValue, isSubmitting }) => (
                            <Form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Choose Address
                                    </label>
                                    <Field
                                        as="select"
                                        name="addressId"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                                        onChange={(e) => handleAddressSelection(e.target.value, setFieldValue)}
                                    >
                                        <option value="">Select an address...</option>
                                        {addresses.map((address) => (
                                            <option key={address._id} value={address._id}>
                                                {address.street}, {address.city}, {address.state}, {address.zipCode}
                                            </option>
                                        ))}
                                        <option value="new">+ Add New Address</option>
                                    </Field>
                                    <ErrorMessage name="addressId" component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                {values.addressId === 'new' && (
                                    <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                        <h4 className="font-medium text-gray-900 mb-4">Add New Address</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                                                <Field
                                                    type="text"
                                                    name="street"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="123 Main Street"
                                                />
                                                <ErrorMessage name="street" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                                <Field
                                                    type="text"
                                                    name="city"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="New York"
                                                />
                                                <ErrorMessage name="city" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                                <Field
                                                    type="text"
                                                    name="state"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="NY"
                                                />
                                                <ErrorMessage name="state" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                                                <Field
                                                    type="text"
                                                    name="zipCode"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="10001"
                                                />
                                                <ErrorMessage name="zipCode" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                                <Field
                                                    type="text"
                                                    name="country"
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    placeholder="USA"
                                                />
                                                <ErrorMessage name="country" component="div" className="text-red-500 text-sm mt-1" />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
                                        >
                                            {isSubmitting ? 'Adding Address...' : 'Add Address'}
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <p className="text-red-600 text-sm">{error}</p>
                                    </div>
                                )}
                            </Form>
                        )}
                    </Formik>
                )}
            </div>

            {selectedAddress && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">Selected Address</h4>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <p className="text-gray-900 font-medium">{selectedAddress.street}</p>
                                        <p className="text-gray-600">
                                            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                                        </p>
                                        <p className="text-gray-600">{selectedAddress.country}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={onBack}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                        >
                            Back to Products
                        </button>
                        <button
                            onClick={onNext}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                            Review Order
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddressSelection;