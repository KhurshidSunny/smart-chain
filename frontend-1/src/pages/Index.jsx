import { useEffect, useState } from 'react';
import { Truck, Package, BarChart3, QrCode, ArrowRight, Users, Clock, Shield, Zap } from 'lucide-react';
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
            title: "Package QR codes",
            description: "Packing can create a QR code for a package. A tracking number can be opened on a public page without signing in."
        },
        {
            icon: Package,
            title: "Inventory",
            description: "The inventory screen shows stock, a demand forecast, and reorder suggestions from past orders."
        },
        {
            icon: Truck,
            title: "Shipment status",
            description: "Logistics can mark a shipment dispatched, in transit, out for delivery, or delivered. The tracking page shows those updates."
        },
        {
            icon: BarChart3,
            title: "Order checks",
            description: "Unusual order quantities can be flagged. The admin reports page summarizes users, orders, stock, picking lists, and shipments."
        }
    ];

    const stats = [
        { number: "6", label: "Services" },
        { number: "Events", label: "Passed through RabbitMQ" },
        { number: "QR", label: "Code on a packed package" },
        { number: "Roles", label: "Each account sees its own screens" }
    ];

    const benefits = [
        { icon: Clock, title: "Order handoff", description: "A placed order is sent on for warehouse picking and packing." },
        { icon: Shield, title: "Role access", description: "Signing in shows the screens allowed for that account." },
        { icon: Users, title: "Separate services", description: "Inventory, warehouse, logistics, and sales each keep their own work." },
        { icon: Zap, title: "Status changes", description: "A shipment status can be updated and then read on the tracking page." }
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
        <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
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
                            Create Account
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 px-6 py-20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="mb-8 text-5xl font-bold md:text-7xl">
                            <span className="block leading-tight">Supply Chain</span>
                            <span className="mt-1 block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text pb-3 leading-[1.3] text-transparent">
                                Reimagined
                            </span>
                        </h1>
                        <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-300">
                            Inventory, warehouse, logistics, and sales each run as their own service.
                            Order events pass through RabbitMQ. Packing can create a QR code, and a tracking number can be opened without signing in.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                to='/register'
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center space-x-2"
                            >
                                <span>Create Account</span>
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
                    <div className="mb-20 grid grid-cols-2 gap-6 md:grid-cols-4">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center"
                            >
                                <div className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text pb-1 text-3xl font-bold leading-normal text-transparent md:text-4xl">
                                    {stat.number}
                                </div>
                                <div className="mt-2 text-sm leading-snug text-gray-300 md:text-base">{stat.label}</div>
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
                        <h2 className="mb-6 text-4xl font-bold leading-tight">Run an order through the services</h2>
                        <p className="mb-8 text-xl leading-relaxed text-gray-300">
                            Create an account or sign in to place an order, pick and pack it, and follow the shipment.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/register')}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
                            >
                                Create Account
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="border border-gray-600 hover:border-gray-400 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:bg-gray-800/50"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 grid gap-8 md:grid-cols-[minmax(0,36rem)_auto] md:items-start">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Package className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-xl font-bold">Smart-Chain</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed">
                                Inventory, warehouse, logistics, and sales services, plus an analytics module for forecasts, reorder suggestions, and unusual order sizes.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-4 text-lg font-semibold">Open</h3>
                            <ul className="space-y-2 text-gray-400">
                                <li><button onClick={() => navigate('/login')} className="transition-colors hover:text-white">Sign In</button></li>
                                <li><button onClick={() => navigate('/register')} className="transition-colors hover:text-white">Create Account</button></li>
                                <li><button onClick={() => navigate('/tracking')} className="transition-colors hover:text-white">Track Order</button></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8">
                        <p className="text-gray-400">
                            © {new Date().getFullYear()} Smart-Chain
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;