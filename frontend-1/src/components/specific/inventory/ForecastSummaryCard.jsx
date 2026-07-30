import { useEffect, useState } from 'react';
import { getReorderSuggestions } from '../../../services/analyticsService';

function ForecastSummaryCard() {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecastSummary = async () => {
            try {
                const response = await getReorderSuggestions({ horizonDays: 7 });
                const items = response.data?.data || [];
                const withDemand = items.filter((item) => item.predictedDemand > 0);
                const totalPredictedDemand = withDemand.reduce(
                    (total, item) => total + (item.predictedDemand || 0),
                    0
                );
                const topProducts = [...withDemand]
                    .sort((a, b) => b.predictedDemand - a.predictedDemand)
                    .slice(0, 3);

                setSummary({
                    horizonDays: response.data?.horizonDays || 7,
                    productCount: items.length,
                    productsWithDemand: withDemand.length,
                    totalPredictedDemand: Math.round(totalPredictedDemand),
                    topProducts,
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load forecast summary');
            } finally {
                setLoading(false);
            }
        };

        fetchForecastSummary();
    }, []);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Demand Forecast</h2>
                <p className="text-gray-500">Loading forecast...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Demand Forecast</h2>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Demand Forecast ({summary.horizonDays} days)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <p className="text-sm text-gray-500">Predicted Demand</p>
                    <p className="text-2xl font-bold text-primary">{summary.totalPredictedDemand}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Products With Demand</p>
                    <p className="text-2xl font-bold text-primary">{summary.productsWithDemand}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Active Products</p>
                    <p className="text-2xl font-bold text-primary">{summary.productCount}</p>
                </div>
            </div>
            {summary.topProducts.length > 0 ? (
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-2">Top Forecasted Products</h3>
                    <ul className="space-y-2">
                        {summary.topProducts.map((product) => (
                            <li key={product.productId} className="flex justify-between text-sm">
                                <span>
                                    {product.name} (SKU: {product.sku})
                                </span>
                                <span className="text-primary font-medium">
                                    {Math.round(product.predictedDemand)} units
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="text-gray-500 text-sm">No forecasted demand available yet.</p>
            )}
        </div>
    );
}

export default ForecastSummaryCard;
