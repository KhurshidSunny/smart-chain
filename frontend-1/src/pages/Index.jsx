import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import logo from '../assets/react.svg'; // Placeholder for logo
import heroImage from '../assets/images/heroImage.jpeg'; // Placeholder for hero image
import { useEffect } from 'react';

const Index = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Redirect authenticated users to dashboard
    useEffect(()=>{
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Hero Section */}
            <section className="flex-grow bg-gradient-to-r from-blue-100 to-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col md:flex-row items-center">
                    <div className="md:w-1/2 mb-8 md:mb-0">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Streamline Your Supply Chain with Smart-Chain
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Track orders in real-time, manage inventory, and ensure seamless fulfillment with our QR code-based platform.
                        </p>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition text-lg font-semibold"
                        >
                            Get Started
                        </button>
                    </div>
                    <div className="md:w-1/2">
                        <img
                            src={heroImage}
                            alt="Smart-Chain Platform"
                            className="w-full h-auto rounded-lg shadow-lg"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                        Why Choose Smart-Chain?
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="bg-blue-100 rounded-full p-4 inline-block mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Tracking</h3>
                            <p className="text-gray-600">
                                Monitor your orders from creation to delivery with QR code scanning and live updates.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-100 rounded-full p-4 inline-block mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventory Management</h3>
                            <p className="text-gray-600">
                                Keep track of stock levels and reservations to ensure accurate order fulfillment.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="bg-blue-100 rounded-full p-4 inline-block mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Efficient Fulfillment</h3>
                            <p className="text-gray-600">
                                Streamline picking, packing, and shipping with integrated QR code workflows.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="bg-blue-600 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Supply Chain?</h2>
                    <p className="text-lg mb-6">
                        Join Smart-Chain today and experience seamless order processing and real-time tracking.
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        className="bg-white text-blue-600 px-6 py-3 rounded-md hover:bg-gray-100 transition text-lg font-semibold"
                    >
                        Sign Up Now
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Smart-Chain</h3>
                            <p className="text-gray-400">
                                Empowering businesses with efficient supply chain management.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2">
                                <li>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        Login
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate('/auth/register')}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        Register
                                    </button>
                                </li>
                                <li>
                                    <a href="/tracking" className="text-gray-400 hover:text-white">
                                        Track Order
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
                            <p className="text-gray-400">
                                Email: support@smartchain.com
                                <br />
                                Phone: (123) 456-7890
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 text-center text-gray-400">
                        &copy; {new Date().getFullYear()} Smart-Chain. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;