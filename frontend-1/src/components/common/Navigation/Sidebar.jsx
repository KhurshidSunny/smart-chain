// components/common/Navigation/Sidebar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { getSidebarItems } from '../../../utils/navigationUtils';
import useAuthStore from '../../../stores/authStore';

// Enhanced SVG Icons with better styling
const ChevronLeftIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
);

const MenuIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const CloseIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

function Sidebar({ isOpen, onToggle }) {
    const { user } = useAuthStore();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [touchStartX, setTouchStartX] = useState(0);
    const [touchStartY, setTouchStartY] = useState(0);

    const sidebarItems = getSidebarItems(user?.role);

    // Enhanced responsive breakpoint detection
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Handle escape key to close sidebar on mobile
    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape' && isMobile && isOpen) {
                onToggle();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isMobile, isOpen, onToggle]);

    // Touch gesture handling for mobile
    const handleTouchStart = (e) => {
        if (!isMobile) return;
        setTouchStartX(e.touches[0].clientX);
        setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e) => {
        if (!isMobile || !touchStartX) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartX;
        const deltaY = Math.abs(currentY - touchStartY);

        // Only handle horizontal swipes
        if (deltaY < 50) {
            if (isOpen && deltaX < -50) {
                onToggle();
            }
        }
    };

    const handleTouchEnd = () => {
        setTouchStartX(0);
        setTouchStartY(0);
    };

    const isItemActive = (item) => {
        if (item.to && (location.pathname === item.to ||
            (item.activePattern && item.activePattern.test(location.pathname)))) {
            return true;
        }

        if (item.subItems) {
            return item.subItems.some(subItem =>
                location.pathname === subItem.to ||
                (subItem.activePattern && subItem.activePattern.test(location.pathname))
            );
        }

        return false;
    };

    // Calculate sidebar width based on screen size and state
    const getSidebarClasses = () => {
        if (isMobile) {
            return `
                fixed left-0 top-0 h-full bg-white shadow-2xl transform transition-all duration-300 ease-out z-50
                ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0'}
            `;
        }

        if (isTablet) {
            return `
                fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
                shadow-lg transform transition-all duration-300 ease-in-out z-30
                ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0'}
            `;
        }

        // Desktop
        return `
            relative top-0 h-full bg-white border-r border-gray-200 
            shadow-sm transition-all duration-300 ease-in-out
            ${isOpen ? 'w-64' : 'w-16'}
        `;
    };

    return (
        <>
            {/* Enhanced overlay for mobile with blur effect */}
            {isOpen && (isMobile || isTablet) && (
                <div
                    className={`
                        fixed inset-0 bg-black transition-all duration-300 z-40
                        ${isMobile ? 'bg-opacity-60 backdrop-blur-sm' : 'bg-opacity-50'}
                    `}
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <div
                ref={sidebarRef}
                className={getSidebarClasses()}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Mobile header with close button */}
                {isMobile && (
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary-dark/5">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-sm">
                                <span className="text-white text-sm font-bold">S</span>
                            </div>
                            <span className="text-lg font-semibold text-gray-900">Smart-Chain</span>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            aria-label="Close sidebar"
                        >
                            <CloseIcon className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                )}

                {/* Desktop toggle button with enhanced styling */}
                {!isMobile && !isTablet && (
                    <button
                        onClick={onToggle}
                        className="absolute -right-3 top-6 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 z-10 group"
                        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {isOpen ? (
                            <ChevronLeftIcon className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
                        ) : (
                            <ChevronRightIcon className="w-4 h-4 text-gray-600 group-hover:text-gray-800 transition-colors" />
                        )}
                    </button>
                )}

                {/* Sidebar content */}
                <div className="flex flex-col h-full">
                    {/* User info section with enhanced styling */}
                    <div className={`
                        border-b border-gray-200 flex-shrink-0 transition-all duration-300 bg-gradient-to-r from-gray-50 to-gray-100/50
                        ${isMobile ? 'p-4' : (isOpen ? 'p-4' : 'p-3')}
                        ${!isMobile && !isOpen ? 'mx-2 my-2 rounded-lg border' : ''}
                    `}>
                        <div className="flex items-center space-x-3">
                            <div className={`
                                bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                                ${isOpen || isMobile ? 'w-10 h-10' : 'w-8 h-8'}
                                transition-all duration-300
                            `}>
                                <span className={`
                                    text-white font-semibold
                                    ${isOpen || isMobile ? 'text-sm' : 'text-xs'}
                                `}>
                                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            {(isOpen || isMobile) && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user?.firstName || user?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate capitalize font-medium">
                                        {user?.role?.replace('_', ' ').toLowerCase() || 'Role'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation items with enhanced scrolling */}
                    <nav className={`
                        flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar
                        ${isOpen || isMobile ? 'px-3 py-4 space-y-1' : 'px-2 py-4 space-y-2'}
                    `}>
                        {sidebarItems.map((item) => (
                            <div
                                key={item.to || item.label}
                                className="relative"
                                onMouseEnter={() => !isOpen && !isMobile && setHoveredItem(item)}
                                onMouseLeave={() => !isOpen && !isMobile && setHoveredItem(null)}
                            >
                                <SidebarItem
                                    item={item}
                                    isActive={isItemActive(item)}
                                    isCollapsed={!isOpen && !isMobile}
                                />

                                {/* Enhanced tooltip for collapsed desktop sidebar */}
                                {!isOpen && !isMobile && !isTablet && hoveredItem === item && (
                                    <div className="absolute left-full top-0 ml-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl text-sm whitespace-nowrap shadow-2xl border border-gray-700 animate-in fade-in-0 zoom-in-95 duration-200 max-w-xs">
                                        <div className="font-medium text-gray-100">{item.label}</div>
                                        {item.description && (
                                            <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                        )}
                                        {item.subItems && item.subItems.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-gray-700">
                                                {item.subItems.slice(0, 4).map((subItem, index) => (
                                                    <div key={index} className="text-xs text-gray-300 py-1 flex items-center hover:text-white transition-colors">
                                                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full mr-2 flex-shrink-0"></span>
                                                        <span className="truncate">{subItem.label}</span>
                                                    </div>
                                                ))}
                                                {item.subItems.length > 4 && (
                                                    <div className="text-xs text-gray-400 py-1 italic">
                                                        +{item.subItems.length - 4} more items...
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* Enhanced arrow with better positioning */}
                                        <div className="absolute left-0 top-4 transform -translate-x-2 w-0 h-0 border-r-8 border-r-gray-900 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </nav>

                    {/* Enhanced footer with better responsive design */}
                    <div className={`
                        border-t border-gray-200 flex-shrink-0 transition-all duration-300 bg-gradient-to-r from-gray-50 to-gray-100/50
                        ${isMobile ? 'p-4' : (isOpen ? 'p-4' : 'p-3')}
                    `}>
                        {(isOpen || isMobile) && (
                            <div className="text-center">
                                <div className="text-xs text-gray-500 font-medium mb-2">
                                    Smart-Chain v1.0.2
                                </div>
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="relative">
                                        <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-sm"></div>
                                        <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-30"></div>
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">System Online</span>
                                </div>
                            </div>
                        )}
                        {!isOpen && !isMobile && (
                            <div className="flex justify-center">
                                <div className="relative">
                                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping opacity-30"></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resize handle for tablets */}
                {isTablet && isOpen && (
                    <div className="absolute right-0 top-0 w-1 h-full cursor-ew-resize hover:bg-primary/20 transition-colors duration-200 group">
                        <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-3 h-8 bg-gray-300 group-hover:bg-primary/40 rounded-r-md transition-colors duration-200"></div>
                    </div>
                )}
            </div>

            {/* Enhanced custom styles */}
            <style jsx>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #cbd5e1 transparent;
                }
                
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 3px;
                    margin: 8px 0;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #cbd5e1, #94a3b8);
                    border-radius: 3px;
                    border: 1px solid #e2e8f0;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(180deg, #94a3b8, #64748b);
                }
                
                .animate-in {
                    animation-name: animate-in;
                    animation-duration: 200ms;
                    animation-fill-mode: both;
                    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
                }
                
                .fade-in-0 {
                    animation-name: fade-in;
                }
                
                .zoom-in-95 {
                    animation-name: zoom-in;
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
                @keyframes zoom-in {
                    from {
                        transform: scale(0.95);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* Mobile-specific improvements */
                @media (max-width: 767px) {
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 0px;
                        background: transparent;
                    }
                }

                /* Touch-friendly hover states */
                @media (hover: hover) {
                    .hover\\:shadow-xl:hover {
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    }
                }

                /* High contrast mode support */
                @media (prefers-contrast: high) {
                    .border-gray-200 {
                        border-color: #000;
                    }
                    
                    .text-gray-600 {
                        color: #000;
                    }
                }

                /* Reduced motion support */
                @media (prefers-reduced-motion: reduce) {
                    .transition-all,
                    .animate-pulse,
                    .animate-ping {
                        animation: none !important;
                        transition: none !important;
                    }
                }
            `}</style>
        </>
    );
}

export default Sidebar;