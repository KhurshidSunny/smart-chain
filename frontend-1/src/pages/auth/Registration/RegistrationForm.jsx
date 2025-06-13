import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { register } from '../../../services/authService';
import useAuthStore from '../../../stores/authStore';

const validationSchema = Yup.object({
    firstName: Yup.string().required('First name is required'),
    lastName: Yup.string().required('Last name is required'),
    username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone number is required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required'),
    terms: Yup.boolean().oneOf([true], 'You must accept the terms of service'),
});

function RegistrationForm() {
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const { terms, confirmPassword, ...userData } = values;
            const response = await register(userData);
            setAuth(response.user, response.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Formik
            initialValues={{
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                phone: '',
                password: '',
                confirmPassword: '',
                terms: false,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
        >
            {({ isSubmitting }) => (
                <Form className="space-y-4">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First Name
                        </label>
                        <Field
                            type="text"
                            name="firstName"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last Name
                        </label>
                        <Field
                            type="text"
                            name="lastName"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <Field
                            type="text"
                            name="username"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="username" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Field
                            type="email"
                            name="email"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                        </label>
                        <Field
                            type="text"
                            name="phone"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="phone" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <Field
                            type="password"
                            name="password"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                            Confirm Password
                        </label>
                        <Field
                            type="password"
                            name="confirmPassword"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                        />
                        <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    <div>
                        <label className="flex items-center">
                            <Field
                                type="checkbox"
                                name="terms"
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                                I accept the{' '}
                                <a href="/terms" className="text-primary hover:underline">
                                    Terms of Service
                                </a>
                            </span>
                        </label>
                        <ErrorMessage name="terms" component="div" className="text-red-500 text-sm mt-1" />
                    </div>
                    {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Registering...' : 'Register'}
                    </button>
                </Form>
            )}
        </Formik>
    );
}

export default RegistrationForm;