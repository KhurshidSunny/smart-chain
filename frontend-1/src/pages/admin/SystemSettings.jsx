import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { ROLES } from '../../utils/constants';
import { API_URLS } from '../../utils/constants';
import {
    getOperatorSettings,
    saveOperatorSettings,
} from '../../utils/operatorSettings';
import useFeedbackStore from '../../stores/feedbackStore';

const SERVICES = [
    { name: 'IAM', url: API_URLS.IAM, port: 3001 },
    { name: 'Sales', url: API_URLS.SALES, port: 3002 },
    { name: 'Inventory', url: API_URLS.INVENTORY, port: 3003 },
    { name: 'Warehouse', url: API_URLS.WAREHOUSE, port: 3004 },
    { name: 'Logistics', url: API_URLS.LOGISTICS, port: 3005 },
    { name: 'Analytics', url: API_URLS.ANALYTICS, port: 3006, health: true },
];

async function pingService(service) {
    if (!service.url) {
        return { ...service, status: 'unconfigured' };
    }
    const target = service.health ? `${service.url}/health` : service.url;
    try {
        const response = await fetch(target, { method: 'GET' });
        const up = response.ok || response.status === 401 || response.status === 404;
        return { ...service, status: up ? 'up' : `http ${response.status}` };
    } catch {
        return { ...service, status: 'down' };
    }
}

function SystemSettings() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const showSuccess = useFeedbackStore((state) => state.showSuccess);
    const [settings, setSettings] = useState(getOperatorSettings);
    const [services, setServices] = useState([]);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || user?.role !== ROLES.ADMIN) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        let cancelled = false;
        const check = async () => {
            setChecking(true);
            const results = await Promise.all(SERVICES.map(pingService));
            if (!cancelled) {
                setServices(results);
                setChecking(false);
            }
        };
        check();
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSave = (event) => {
        event.preventDefault();
        const saved = saveOperatorSettings(settings);
        setSettings(saved);
        showSuccess(
            'Preferences saved',
            'Inventory forecast and reorder cards use this horizon after you reload those pages.'
        );
    };

    return (
        <div className="min-h-screen p-6">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h1 className="text-2xl font-semibold text-gray-800">System Settings</h1>
               
            </div>

            <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Analytics horizon</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Default forecast window used on the inventory dashboard (moving average or
                    exponential smoothing — not a trained model).
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="horizon">
                    Forecast horizon (days)
                </label>
                <select
                    id="horizon"
                    className="border border-gray-300 rounded-md px-3 py-2 mb-4"
                    value={settings.forecastHorizonDays}
                    onChange={(event) =>
                        setSettings({
                            ...settings,
                            forecastHorizonDays: Number(event.target.value),
                        })
                    }
                >
                    <option value={7}>7</option>
                    <option value={14}>14</option>
                    <option value={30}>30</option>
                </select>
                <div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                    >
                        Save preferences
                    </button>
                </div>
            </form>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Service status</h2>
                {checking ? (
                    <p className="text-gray-600">Checking services…</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {services.map((service) => (
                            <li
                                key={service.name}
                                className="py-3 flex justify-between items-center"
                            >
                                <span className="text-gray-800">
                                    {service.name}
                                    <span className="text-gray-500 text-sm ml-2">
                                        :{service.port}
                                    </span>
                                </span>
                                <span
                                    className={`text-sm font-medium ${
                                        service.status === 'up'
                                            ? 'text-green-600'
                                            : service.status === 'unconfigured'
                                              ? 'text-amber-600'
                                              : 'text-red-600'
                                    }`}
                                >
                                    {service.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default SystemSettings;
