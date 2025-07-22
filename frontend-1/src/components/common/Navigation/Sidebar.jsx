// components/common/Navigation/Sidebar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SidebarItem from './SidebarItem';
import { getSidebarItems } from '../../../utils/navigationUtils';
import useAuthStore from '../../../stores/authStore';

// Simple SVG Icons
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

function Sidebar({ isOpen, onToggle }) {
    const { user } = useAuthStore();
    const location = useLocation();
    const sidebarItems = getSidebarItems(user?.role);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
                shadow-lg transform transition-transform duration-300 ease-in-out z-30
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isOpen ? 'w-64' : 'w-0'}
                md:relative md:top-0 md:h-full md:translate-x-0
                ${isOpen ? 'md:w-64' : 'md:w-16'}
            `}>
                {/* Toggle button - only visible on desktop */}
                <button
                    onClick={onToggle}
                    className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md hidden md:block hover:bg-gray-50 transition-colors"
                >
                    {isOpen ? (
                        <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                    ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                    )}
                </button>

                {/* Sidebar content */}
                <div className="flex flex-col h-full">
                    {/* User info */}
                    <div className={`p-4 border-b border-gray-200 flex-shrink-0 ${!isOpen && 'md:p-2'}`}>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-sm font-semibold">
                                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            {isOpen && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {user?.firstName || user?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate capitalize">
                                        {user?.role?.replace('_', ' ').toLowerCase() || 'Role'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation items - scrollable area */}
                    <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                        {sidebarItems.map((item) => (
                            <SidebarItem
                                key={item.to}
                                item={item}
                                isActive={location.pathname === item.to ||
                                    (item.activePattern && item.activePattern.test(location.pathname))}
                                isCollapsed={!isOpen}
                            />
                        ))}
                    </nav>

                    {/* Footer space if needed */}
                    <div className={`p-2 border-t border-gray-200 flex-shrink-0 ${!isOpen && 'md:p-1'}`}>
                        {/* You can add footer content here like version info, help links etc */}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Sidebar;