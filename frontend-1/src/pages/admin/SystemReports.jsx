import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROLES } from '../../utils/constants';
import { getUsers } from '../../services/userService';
import { getOrders } from '../../services/orderService';
import { getInventorySummary } from '../../services/inventoryService';
import { getPickingLists } from '../../services/warehouseService';
import { getShipments } from '../../services/logisticsService';
import { getOrderAnomalies, getReorderSuggestions } from '../../services/analyticsService';
import { getOperatorSettings } from '../../utils/operatorSettings';

function unwrapList(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.orders)) return payload.orders;
    if (Array.isArray(payload?.users)) return payload.users;
    if (Array.isArray(payload?.shipments)) return payload.shipments;
    return [];
}

function StatCard({ label, value, hint, failed }) {
    return (
        <div className="bg-white p-5 rounded-lg shadow-md">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${failed ? 'text-gray-400' : 'text-blue-600'}`}>
                {failed ? '—' : value}
            </p>
            {hint && <p className="text-xs text-gray-500 mt-2">{hint}</p>}
        </div>
    );
}

function SystemReports() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const horizonDays = getOperatorSettings().forecastHorizonDays;
            const results = await Promise.allSettled([
                getUsers(),
                getOrders(),
                getInventorySummary(),
                getPickingLists(),
                getShipments(),
                getReorderSuggestions({ horizonDays }),
                getOrderAnomalies(),
            ]);

            const take = (index) =>
                results[index].status === 'fulfilled' ? results[index].value : null;

            const usersRes = take(0);
            const ordersRes = take(1);
            const inventoryRes = take(2);
            const pickingRes = take(3);
            const shipmentsRes = take(4);
            const reorderRes = take(5);
            const anomaliesRes = take(6);

            const users = unwrapList(usersRes?.data);
            const orders = unwrapList(ordersRes?.data);
            const picking = unwrapList(pickingRes?.data);
            const shipments = unwrapList(shipmentsRes?.data);
            const reorderItems = unwrapList(reorderRes?.data);
            const anomalies = unwrapList(anomaliesRes?.data);

            setReport({
                generatedAt: new Date().toLocaleString(),
                horizonDays: reorderRes?.data?.horizonDays || horizonDays,
                users: {
                    ok: Boolean(usersRes),
                    count: users.length || usersRes?.data?.users?.length || 0,
                },
                orders: { ok: Boolean(ordersRes), count: orders.length },
                inventory: {
                    ok: Boolean(inventoryRes),
                    totalProducts: inventoryRes?.data?.totalProducts ?? 0,
                    totalStock: inventoryRes?.data?.totalStock ?? 0,
                    lowStockCount: inventoryRes?.data?.lowStockCount ?? 0,
                },
                warehouse: { ok: Boolean(pickingRes), pickingLists: picking.length },
                logistics: { ok: Boolean(shipmentsRes), shipments: shipments.length },
                analytics: {
                    ok: Boolean(reorderRes),
                    reorderCount: reorderItems.filter((item) => item.shouldReorder).length,
                    anomalyCount: anomalies.length,
                    methodsNote:
                        'Forecast uses moving average or exponential smoothing. Anomalies use z-score on order line quantity. Not a deep-learning model.',
                },
            });
            setLoading(false);
        };

        load();
    }, []);

    if (loading || !report) {
        return <div className="text-center p-6 text-gray-600">Loading system reports…</div>;
    }

    return (
        <div className="min-h-screen p-6">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">System Reports</h1>
                <p className="text-gray-600 mt-2">
                    Snapshot from live microservices. Generated {report.generatedAt}. Refresh the
                    page to reload.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard
                    label="Users"
                    value={report.users.count}
                    failed={!report.users.ok}
                    hint="IAM user list"
                />
                <StatCard
                    label="Orders"
                    value={report.orders.count}
                    failed={!report.orders.ok}
                    hint="Sales service"
                />
                <StatCard
                    label="Active products"
                    value={report.inventory.totalProducts}
                    failed={!report.inventory.ok}
                    hint={`Stock units: ${report.inventory.totalStock}`}
                />
                <StatCard
                    label="Low-stock SKUs"
                    value={report.inventory.lowStockCount}
                    failed={!report.inventory.ok}
                    hint="stockLevel ≤ reorderPoint"
                />
                <StatCard
                    label="Picking lists"
                    value={report.warehouse.pickingLists}
                    failed={!report.warehouse.ok}
                    hint="Warehouse service"
                />
                <StatCard
                    label="Shipments"
                    value={report.logistics.shipments}
                    failed={!report.logistics.ok}
                    hint="Logistics service"
                />
                <StatCard
                    label={`Reorder flags (${report.horizonDays}d)`}
                    value={report.analytics.reorderCount}
                    failed={!report.analytics.ok}
                    hint="Analytics suggestedQty > 0"
                />
                <StatCard
                    label="Quantity anomalies"
                    value={report.analytics.anomalyCount}
                    failed={!report.analytics.ok}
                    hint="Z-score vs product history"
                />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Methods</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                    {report.analytics.methodsNote} A dash (—) means that service did not respond;
                    start it and refresh.
                </p>
            </div>
        </div>
    );
}

export default SystemReports;
