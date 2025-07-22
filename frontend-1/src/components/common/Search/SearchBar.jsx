import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { searchItems } from '../../../services/apiClient';

function SearchBar() {
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    // const handleSearch = async (e) => {
    //     e.preventDefault();
    //     if (!query.trim()) return;

    //     try {
    //         // Search across orders, products, and shipments
    //         const response = await searchItems(query);
    //         // Navigate to a search results page or specific item based on results
    //         if (response.orders?.length) {
    //             navigate(`/orders/${response.orders[0].id}`);
    //         } else if (response.products?.length) {
    //             navigate(`/inventory/products/${response.products[0].id}`);
    //         } else if (response.shipments?.length) {
    //             navigate(`/logistics/shipments/${response.shipments[0].id}`);
    //         }
    //     } catch (error) {
    //         console.error('Search error:', error);
    //         // TODO: Display error message to user
    //     }
    // };

    return (
        <form className="flex items-center">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search orders, products, or shipments..."
                className="w-full p-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="submit"
                className="p-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </button>
        </form>
    );
}

export default SearchBar;