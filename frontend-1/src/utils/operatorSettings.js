const STORAGE_KEY = 'smartchain.operatorSettings';

export const DEFAULT_OPERATOR_SETTINGS = {
    forecastHorizonDays: 7,
};

export function getOperatorSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_OPERATOR_SETTINGS };
        const parsed = JSON.parse(raw);
        const horizon = Number(parsed.forecastHorizonDays);
        return {
            forecastHorizonDays: [7, 14, 30].includes(horizon) ? horizon : 7,
        };
    } catch {
        return { ...DEFAULT_OPERATOR_SETTINGS };
    }
}

export function saveOperatorSettings(partial) {
    const next = { ...getOperatorSettings(), ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}
