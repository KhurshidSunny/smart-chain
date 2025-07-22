

// components/common/Navigation/SidebarItem.jsx
import { Link } from 'react-router-dom';

function SidebarItem({ item, isActive, isCollapsed }) {
    const baseClasses = `
        group flex items-center px-3 py-2 text-sm font-medium rounded-md
        transition-colors duration-150 ease-in-out
    `;

    const activeClasses = isActive
        ? 'bg-primary text-white'
        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';

    return (
        <Link
            to={item.to}
            className={`${baseClasses} ${activeClasses}`}
            title={isCollapsed ? item.label : ''}
        >
            {item.icon && (
                <item.icon className={`
                    ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}
                    ${isCollapsed ? 'w-5 h-5' : 'mr-3 w-5 h-5'}
                    flex-shrink-0
                `} />
            )}
            {!isCollapsed && (
                <span className="truncate">{item.label}</span>
            )}
            {item.badge && !isCollapsed && (
                <span className={`
                    ml-auto inline-block py-0.5 px-2 text-xs rounded-full
                    ${isActive ? 'bg-white text-primary' : 'bg-gray-200 text-gray-700'}
                `}>
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

export default SidebarItem;