import { useEffect, useState } from 'react';
import { Truck, Package, BarChart3, QrCode, ArrowRight, CheckCircle, Users, Clock, Shield, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Index = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate(); // Use React Router's useNavigate hook

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]); // Add dependencies to useEffect

    const features = [
        {
            icon: QrCode,
            title: "QR Code Tracking",
            description: "Every order gets a unique QR code for instant tracking and updates throughout the supply chain."
        },
        {
            icon: Package,
            title: "Smart Inventory",
            description: "AI-powered inventory management that predicts demand and optimizes stock levels automatically."
        },
        {
            icon: Truck,
            title: "Real-Time Logistics",
            description: "Live tracking from warehouse to doorstep with automated notifications and delivery confirmations."
        },
        {
            icon: BarChart3,
            title: "Analytics Dashboard",
            description: "Comprehensive insights and reporting to optimize your supply chain performance."
        }
    ];

    const stats = [
        { number: "99.9%", label: "Uptime Guarantee" },
        { number: "50ms", label: "Response Time" },
        { number: "10K+", label: "Orders Processed" },
        { number: "24/7", label: "Support Available" }
    ];

    const benefits = [
        { icon: Clock, title: "Reduce Processing Time", description: "Cut order processing time by up to 60%" },
        { icon: Shield, title: "Enhanced Security", description: "Enterprise-grade security with role-based access" },
        { icon: Users, title: "Team Collaboration", description: "Seamless coordination across all departments" },
        { icon: Zap, title: "Instant Updates", description: "Real-time notifications for all stakeholders" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [features.length]);

    // Don't render the component if user is authenticated (they're being redirected)
    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gray-900 opacity-50 animate-pulse"></div>

            {/* Navigation */}
            <nav className="relative z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Smart-Chain
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            to='/login'
                            className="text-gray-300 hover:text-white transition-colors"
                        >
                            Sign In
                        </Link>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
                            Supply Chain
                            <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Reimagined
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                            Transform your operations with AI-powered logistics, real-time QR tracking,
                            and intelligent automation that scales with your business.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                to='/register'
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center space-x-2"
                            >
                                <span>Start Free Trial</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={() => navigate('/tracking')}
                                className="border border-gray-600 hover:border-gray-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-gray-800/50"
                            >
                                Track Order
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Interactive Features Section */}
            <section className="relative z-10 px-6 py-20 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        Intelligent Features
                    </h2>
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            {features.map((feature, index) => {
                                const Icon = feature.icon;
                                return (
                                    <div
                                        key={index}
                                        className={`p-6 rounded-xl cursor-pointer transition-all duration-300 ${activeFeature === index
                                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30'
                                            : 'bg-gray-800/30 hover:bg-gray-800/50'
                                            }`}
                                        onClick={() => setActiveFeature(index)}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className={`p-3 rounded-lg ${activeFeature === index
                                                ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                                                : 'bg-gray-700'
                                                }`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                                <p className="text-gray-400">{feature.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="relative">
                            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 border border-gray-700">
                                <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        {(() => {
                                            const ActiveIcon = features[activeFeature].icon;
                                            return <ActiveIcon className="w-16 h-16 mx-auto mb-4 text-blue-400" />;
                                        })()}
                                        <h3 className="text-2xl font-bold mb-2">{features[activeFeature].title}</h3>
                                        <p className="text-gray-400">{features[activeFeature].description}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16">
                        Why Choose Smart-Chain?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {benefits.map((benefit, index) => {
                            const Icon = benefit.icon;
                            return (
                                <div key={index} className="group p-6 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all hover:scale-105">
                                    <div className="mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                                    <p className="text-gray-400">{benefit.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-12 border border-gray-700">
                        <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Supply Chain?</h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Join thousands of businesses already using Smart-Chain to optimize their operations.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                            >
                                Start Your Free Trial
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="border border-gray-600 hover:border-gray-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-gray-800/50"
                            >
                                Sign In
                            </button>
                        </div>
                        <div className="flex items-center justify-center mt-6 space-x-6 text-sm text-gray-400">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>No Credit Card Required</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span>14-Day Free Trial</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Package className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xl font-bold">Smart-Chain</span>
                            </div>
                            <p className="text-gray-400">
                                Empowering businesses with next-generation supply chain management.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Platform</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Dashboard</button></li>
                                <li><button onClick={() => navigate('/tracking')} className="hover:text-white transition-colors">Track Order</button></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Analytics</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Integrations</span></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Company</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><span className="hover:text-white transition-colors cursor-pointer">About</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Careers</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Contact</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Blog</span></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Support</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><span className="hover:text-white transition-colors cursor-pointer">Documentation</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Help Center</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Community</span></li>
                                <li><span className="hover:text-white transition-colors cursor-pointer">Status</span></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
                        <p className="text-gray-400">
                            © {new Date().getFullYear()} Smart-Chain. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-6 mt-4 md:mt-0">
                            <span className="text-gray-400 hover:text-white cursor-pointer">Privacy</span>
                            <span className="text-gray-400 hover:text-white cursor-pointer">Terms</span>
                            <span className="text-gray-400 hover:text-white cursor-pointer">Security</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;