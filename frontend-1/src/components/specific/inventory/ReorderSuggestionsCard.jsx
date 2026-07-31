import { useEffect, useState } from 'react';
import { getReorderSuggestions } from '../../../services/analyticsService';
import {
    AnalyticsPanelShell,
    EmptyState,
    ErrorState,
    Spinner,
} from './AnalyticsPanelState';

function ReorderSuggestionsCard() {
    const [suggestions, setSuggestions] = useState([]);
    const [horizonDays, setHorizonDays] = useState(7);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const response = await getReorderSuggestions({ horizonDays: 7 });
                const items = (response.data?.data || []).filter((item) => item.shouldReorder);
                setHorizonDays(response.data?.horizonDays || 7);
                setSuggestions(items);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load reorder suggestions');
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, []);

    if (loading) {
        return (
            <AnalyticsPanelShell title="Reorder Suggestions">
                <Spinner label="Loading reorder suggestions..." />
            </AnalyticsPanelShell>
        );
    }

    if (error) {
        return (
            <AnalyticsPanelShell title="Reorder Suggestions">
                <ErrorState message={error} />
            </AnalyticsPanelShell>
        );
    }

    return (
        <AnalyticsPanelShell
            title="Reorder Suggestions"
            subtitle={`${horizonDays}-day horizon`}
        >
            {suggestions.length > 0 ? (
                <ul className="space-y-3">
                    {suggestions.map((item) => (
                        <li
                            key={item.productId}
                            className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                        >
                            <div className="flex justify-between gap-4">
                                <div>
                                    <p className="font-medium text-gray-800">
                                        {item.name}{' '}
                                        <span className="text-gray-500 font-normal">(SKU: {item.sku})</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">{item.reason}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Stock: {item.stockLevel} · Reorder point: {item.reorderPoint} ·
                                        Forecast: {Math.round(item.predictedDemand)}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm text-gray-500">Suggested qty</p>
                                    <p className="text-2xl font-bold text-primary">{item.suggestedQuantity}</p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState
                    message="No reorder suggestions right now"
                    hint="Stock levels look healthy for the current forecast window."
                />
            )}
        </AnalyticsPanelShell>
    );
}

export default ReorderSuggestionsCard;
