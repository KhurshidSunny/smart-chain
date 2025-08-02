// components/common/Navigation/SidebarItem.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Simple SVG Icons
const ChevronDownIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
);

const ChevronRightIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
);

function SidebarItem({ item, isActive, isCollapsed, level = 0 }) {
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isParentItem = hasSubItems && !item.to; // Parent items without direct links
    const isSubItem = level > 0;
    const isSubSubItem = level > 1;

    // Check if any sub-item is currently active
    const hasActiveSubItem = hasSubItems && item.subItems.some(subItem =>
        location.pathname === subItem.to ||
        (subItem.activePattern && subItem.activePattern.test(location.pathname))
    );

    // Auto-expand/collapse based on active state and location changes
    useEffect(() => {
        if (hasActiveSubItem && !isCollapsed) {
            setIsExpanded(true);
        }
    }, [location.pathname, hasActiveSubItem, isCollapsed]);

    // Collapse when sidebar is collapsed
    useEffect(() => {
        if (isCollapsed) {
            setIsExpanded(false);
        }
    }, [isCollapsed]);

    // Base classes for different item types
    const getBaseClasses = () => {
        const baseTransition = 'group flex items-center text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative';
        
        if (isSubSubItem) {
            return `${baseTransition} py-1.5 px-4 ml-8`;
        } else if (isSubItem) {
            return `${baseTransition} py-2 px-4 ml-6`;
        } else {
            return `${baseTransition} py-2.5 px-3`;
        }
    };

    // Color classes for different states and levels
    const getColorClasses = () => {
        if (isActive) {
            if (isSubItem) {
                return 'bg-blue-50 text-blue-700 border-r-2 border-blue-600';
            } else {
                return 'bg-primary text-white shadow-sm';
            }
        } else if (hasActiveSubItem && !isSubItem) {
            return 'bg-blue-50 text-blue-700';
        } else if (isSubSubItem) {
            return 'text-gray-500 hover:bg-gray-50 hover:text-gray-700';
        } else if (isSubItem) {
            return 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
        } else {
            return 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';
        }
    };

    const handleToggle = (e) => {
        if (hasSubItems) {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
        }
    };

    const handleLinkClick = (e) => {
        // If it's a parent item with subitems and has a direct link
        if (hasSubItems && item.to && !isExpanded) {
            // Don't prevent default, let the navigation happen
            // But also expand the subitems
            setIsExpanded(true);
        }
    };

    const renderIcon = () => {
        if (!item.icon) return null;
        
        const iconSizes = isCollapsed ? 'w-5 h-5' : (isSubItem ? 'w-4 h-4' : 'w-5 h-5');
        const iconMargin = isCollapsed ? '' : (isSubItem ? 'mr-3' : 'mr-3');
        
        let iconColor;
        if (isActive) {
            iconColor = isSubItem ? 'text-blue-600' : 'text-white';
        } else if (hasActiveSubItem && !isSubItem) {
            iconColor = 'text-blue-600';
        } else if (isSubItem) {
            iconColor = 'text-gray-400 group-hover:text-gray-600';
        } else {
            iconColor = 'text-gray-400 group-hover:text-gray-600';
        }

        return (
            <item.icon className={`${iconSizes} ${iconMargin} ${iconColor} flex-shrink-0 transition-colors duration-200`} />
        );
    };

    const renderLabel = () => {
        if (isCollapsed) return null;
        
        return (
            <span className="truncate flex-1 font-medium">
                {item.label}
            </span>
        );
    };

    const renderBadge = () => {
        if (!item.badge || isCollapsed) return null;
        
        const badgeColor = isActive 
            ? (isSubItem ? 'bg-blue-100 text-blue-800' : 'bg-white text-primary')
            : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300';
        
        return (
            <span className={`ml-3 inline-block py-0.5 px-2 text-xs rounded-full font-medium transition-colors duration-200 ${badgeColor}`}>
                {item.badge}
            </span>
        );
    };

    const renderExpandButton = () => {
        if (!hasSubItems || isCollapsed) return null;
        
        const arrowColor = isActive
            ? (isSubItem ? 'text-blue-600' : 'text-white')
            : 'text-gray-400 group-hover:text-gray-600';
        
        return (
            <button
                onClick={handleToggle}
                className={`ml-auto p-1 rounded-md hover:bg-black hover:bg-opacity-10 transition-colors duration-200 ${arrowColor}`}
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
                {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
                ) : (
                    <ChevronRightIcon className="w-4 h-4 transition-transform duration-200" />
                )}
            </button>
        );
    };

    const renderContent = () => (
        <div className="flex items-center w-full min-w-0">
            {renderIcon()}
            {renderLabel()}
            {renderBadge()}
            {renderExpandButton()}
        </div>
    );

    const baseClasses = getBaseClasses();
    const colorClasses = getColorClasses();
    const combinedClasses = `${baseClasses} ${colorClasses}`;

    return (
        <div className="relative">
            {/* Main item */}
            {item.to && !isParentItem ? (
                <Link
                    to={item.to}
                    onClick={handleLinkClick}
                    className={combinedClasses}
                    title={isCollapsed ? item.label : ''}
                >
                    {renderContent()}
                </Link>
            ) : (
                <button
                    onClick={handleToggle}
                    className={`${combinedClasses} w-full text-left`}
                    title={isCollapsed ? item.label : ''}
                    disabled={!hasSubItems}
                >
                    {renderContent()}
                </button>
            )}

            {/* Sub-items with smooth animation */}
            {hasSubItems && !isCollapsed && (
                <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="mt-1 space-y-1 pb-1">
                        {item.subItems.map((subItem, index) => {
                            const isSubItemActive = location.pathname === subItem.to ||
                                (subItem.activePattern && subItem.activePattern.test(location.pathname));
                            
                            return (
                                <SidebarItem
                                    key={subItem.to || `${item.label}-${index}`}
                                    item={subItem}
                                    isActive={isSubItemActive}
                                    isCollapsed={false}
                                    level={level + 1}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Visual separator line for sub-items */}
            {hasSubItems && !isCollapsed && isExpanded && !isSubItem && (
                <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200 -z-10"></div>
            )}
        </div>
    );
}

export default SidebarItem;