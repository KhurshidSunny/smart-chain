function Spinner({ label = 'Loading...' }) {
    return (
        <div className="flex items-center gap-3 py-6" role="status" aria-live="polite">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-gray-500 text-sm">{label}</span>
        </div>
    );
}

function EmptyState({ message, hint }) {
    return (
        <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
            <p className="text-gray-600 text-sm font-medium">{message}</p>
            {hint && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
        </div>
    );
}

function ErrorState({ message }) {
    return (
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-4">
            <p className="text-red-600 text-sm">{message}</p>
        </div>
    );
}

function AnalyticsPanelShell({ title, subtitle, children }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-700">{title}</h2>
                {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}
            </div>
            {children}
        </div>
    );
}

export { Spinner, EmptyState, ErrorState, AnalyticsPanelShell };
