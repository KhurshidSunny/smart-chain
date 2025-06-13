import { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { getAddresses, createAddress } from '../../../services/authService';
import useAuthStore from '../../../stores/authStore';

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

function AddressSelection({ selectedAddress, onAddressChange }) {
    const [addresses, setAddresses] = useState([]);
    const [error, setError] = useState(null);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await getAddresses();
                setAddresses(response.data);
            } catch (err) {
                setError('Failed to load addresses');
            }
        };
        fetchAddresses();
    }, []);

    const handleAddressSelection = (addressId, setFieldValue) => {
        setFieldValue('addressId', addressId);

        if (addressId && addressId !== 'new') {
            const address = addresses.find(addr => addr._id === addressId);
            if (address) {
                // Update parent state with selected address
                onAddressChange(address);
            }
        } else {
            // Clear selected address when switching to new or empty
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
                setAddresses(addressesResponse.data);

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

    return (
        <div>
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
                {({ values, setFieldValue }) => (
                    <Form className="space-y-4">
                        <div>
                            <label htmlFor="addressId" className="block text-sm font-medium text-gray-700">
                                Shipping Address
                            </label>
                            <Field
                                as="select"
                                name="addressId"
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                onChange={(e) => handleAddressSelection(e.target.value, setFieldValue)}
                            >
                                <option value="">Select an address</option>
                                {addresses.map((address) => (
                                    <option key={address._id} value={address._id}>
                                        {address.street}, {address.city}, {address.state}, {address.zipCode}, {address.country}
                                    </option>
                                ))}
                                <option value="new">Add New Address</option>
                            </Field>
                            <ErrorMessage name="addressId" component="div" className="text-red-500 text-sm mt-1" />
                        </div>

                        {values.addressId === 'new' && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="street" className="block text-sm font-medium text-gray-700">
                                        Street
                                    </label>
                                    <Field
                                        type="text"
                                        name="street"
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                    <ErrorMessage name="street" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                        City
                                    </label>
                                    <Field
                                        type="text"
                                        name="city"
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                    <ErrorMessage name="city" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                                        State
                                    </label>
                                    <Field
                                        type="text"
                                        name="state"
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                    <ErrorMessage name="state" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                                        Zip Code
                                    </label>
                                    <Field
                                        type="text"
                                        name="zipCode"
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                    <ErrorMessage name="zipCode" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                                        Country
                                    </label>
                                    <Field
                                        type="text"
                                        name="country"
                                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                    />
                                    <ErrorMessage name="country" component="div" className="text-red-500 text-sm mt-1" />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700"
                                >
                                    Add Address
                                </button>
                            </div>
                        )}

                        {error && <div className="text-red-500 text-sm">{error}</div>}
                    </Form>
                )}
            </Formik>

            {/* Display selected address */}
            {selectedAddress && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <h4 className="text-sm font-medium text-green-800">Selected Address:</h4>
                    <p className="text-sm text-green-700">
                        {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zipCode}, {selectedAddress.country}
                    </p>
                </div>
            )}
        </div>
    );
}

export default AddressSelection;