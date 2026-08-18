import { useEffect, useState } from 'react';
import { getReorderSuggestions } from '../../../services/analyticsService';
import { getOperatorSettings } from '../../../utils/operatorSettings';
import {
    AnalyticsPanelShell,
    EmptyState,
    ErrorState,
    Spinner,
} from './AnalyticsPanelState';
import {
    formatEvaluationHint,
    formatForecastMethod,
} from './forecastDisplay';

function ForecastSummaryCard() {
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForecastSummary = async () => {
            try {
                const horizonDays = getOperatorSettings().forecastHorizonDays;
                const response = await getReorderSuggestions({ horizonDays });
                const items = response.data?.data || [];
                const withDemand = items.filter((item) => item.predictedDemand > 0);
                const totalPredictedDemand = withDemand.reduce(
                    (total, item) => total + (item.predictedDemand || 0),
                    0
                );
                const topProducts = [...withDemand]
                    .sort((a, b) => b.predictedDemand - a.predictedDemand)
                    .slice(0, 3);

                const methodsUsed = [
                    ...new Set(
                        withDemand
                            .map((item) => item.forecastMethod)
                            .filter(Boolean)
                    ),
                ];

                setSummary({
                    horizonDays: response.data?.horizonDays || 7,
                    productCount: items.length,
                    productsWithDemand: withDemand.length,
                    totalPredictedDemand: Math.round(totalPredictedDemand),
                    topProducts,
                    methodsUsed,
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
            <AnalyticsPanelShell title="Demand Forecast">
                <Spinner label="Loading forecast summary..." />
            </AnalyticsPanelShell>
        );
    }

    if (error) {
        return (
            <AnalyticsPanelShell title="Demand Forecast">
                <ErrorState message={error} />
            </AnalyticsPanelShell>
        );
    }

    if (!summary || summary.productCount === 0) {
        return (
            <AnalyticsPanelShell title="Demand Forecast">
                <EmptyState
                    message="No products available for forecasting"
                    hint="Add active products in inventory, then refresh this page."
                />
            </AnalyticsPanelShell>
        );
    }

    const methodSubtitle =
        summary.methodsUsed.length > 0
            ? summary.methodsUsed.map(formatForecastMethod).join(' · ')
            : null;

    return (
        <AnalyticsPanelShell
            title={`Demand Forecast (${summary.horizonDays} days)`}
            subtitle={methodSubtitle}
        >
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
                            <li key={product.productId} className="text-sm">
                                <div className="flex justify-between gap-3">
                                    <span>
                                        {product.name} (SKU: {product.sku})
                                    </span>
                                    <span className="text-primary font-medium shrink-0">
                                        {Math.round(product.predictedDemand)} units
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {formatForecastMethod(product.forecastMethod)}
                                    {' · '}
                                    {formatEvaluationHint(product.evaluation)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <EmptyState
                    message="No forecasted demand available yet"
                    hint="Place a few demo orders to build demand history, then refresh."
                />
            )}
        </AnalyticsPanelShell>
    );
}

export default ForecastSummaryCard;
