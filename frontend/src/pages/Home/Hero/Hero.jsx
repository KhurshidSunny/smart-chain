import React, { useState, useEffect } from 'react';
import { ArrowRight, Package, TrendingUp, Truck, BarChart2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
    const [activeFeature, setActiveFeature] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);

        const interval = setInterval(() => {
            setActiveFeature((prev) => (prev + 1) % features.length);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: <TrendingUp size={24} />,
            title: "Real-time Analytics",
            description: "Track inventory levels, sales performance, and logistics in real-time",
        },
        {
            icon: <Package size={24} />,
            title: "Inventory Management",
            description: "QR code tracking system for precise inventory control",
        },
        {
            icon: <Truck size={24} />,
            title: "Logistics Optimization",
            description: "Intelligent route planning and shipment coordination",
        },
        {
            icon: <BarChart2 size={24} />,
            title: "Predictive Analytics",
            description: "AI-powered demand forecasting and inventory planning",
        },
        {
            icon: <AlertCircle size={24} />,
            title: "Smart Alerts",
            description: "Automated notifications for reordering and critical events",
        },
    ];

    return (
        <div className="relative bg-background-gradient overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-background-white"
                            style={{
                                width: `${Math.random() * 400 + 100}px`,
                                height: `${Math.random() * 400 + 100}px`,
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                opacity: Math.random() * 0.5,
                                animation: `float ${Math.random() * 10 + 20}s linear infinite`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-12 lg:py-16 relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    {/* Left Section: Heading, Description, Buttons */}
                    <div
                        className={`lg:w-1/2 transition-all duration-1000 transform ${
                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        }`}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-light leading-tight mb-4">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-light to-indigo-deep">
                                Smart-Chain
                            </span>
                            <br />
                            <span className="text-primary-light text-2xl md:text-3xl">
                                Intelligent Supply Chain Management
                            </span>
                        </h1>
                        <p className="text-primary-deep text-lg md:text-xl mb-6 max-w-lg">
                            Transform your supply chain with our comprehensive, AI-powered management system. From inventory to logistics, Smart-Chain brings everything together.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/login"
                                className="bg-highlight hover:bg-primary-dark hover:text-text-primary text-text-light font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center"
                            >
                                Get Started <ArrowRight className="ml-2" size={20} />
                            </Link>
                            <button className="bg-transparent border-2 border-primary-light text-primary-deep hover:bg-primary-accent hover:text-text-light hover:border-primary font-bold py-3 px-6 rounded-lg transition-all">
                                Schedule Demo
                            </button>
                        </div>
                    </div>

                    {/* Right Section: Features */}
                    <div
                        className={`lg:w-1/2 transition-all duration-1000 transform ${
                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                        } delay-300`}
                    >
                        <div className="bg-background-white/10 backdrop-blur-lg p-6 rounded-2xl border border-text-light/20 shadow-2xl">
                            <div className="bg-gradient-to-br from-primary-deep to-indigo-deep rounded-xl p-6 shadow-inner">
                                <div className="flex justify-between mb-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-error"></div>
                                        <div className="w-3 h-3 rounded-full bg-warning"></div>
                                        <div className="w-3 h-3 rounded-full bg-success"></div>
                                    </div>
                                    <div className="text-indigo-light text-sm">Smart-Chain Dashboard</div>
                                </div>

                                <div className="space-y-4">
                                    {features.map((feature, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                                                activeFeature === index
                                                    ? 'bg-primary-dark/50 border border-primary-light/30'
                                                    : 'bg-primary-accent/20'
                                            }`}
                                        >
                                            <div
                                                className={`p-3 rounded-full ${
                                                    activeFeature === index ? 'bg-highlight' : 'bg-primary-accent'
                                                }`}
                                            >
                                                {feature.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-text-light font-bold">{feature.title}</h3>
                                                <p className="text-indigo-light text-sm">{feature.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
                    <path
                        fill="#ffffff"
                        fillOpacity="0.07"
                        d="M0,128L48,144C96,160,192,192,288,192C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                    ></path>
                </svg>
            </div>
        </div>
    );
};

export default Hero;