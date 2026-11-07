let accessToken = '';
let csrfToken = '';

export function readCsrfCookie() {
    if (typeof document === 'undefined') return '';
    for (const part of document.cookie.split(';')) {
        const [name, ...rest] = part.trim().split('=');
        if (name === 'smartchain_csrf') return decodeURIComponent(rest.join('='));
    }
    return '';
}

export function setAccess(token, csrf) {
    accessToken = token || '';
    if (csrf) csrfToken = csrf;
}

export function clearAccess() {
    accessToken = '';
    csrfToken = '';
    if (typeof document !== 'undefined') {
        document.cookie = 'smartchain_csrf=; Path=/; Max-Age=0; SameSite=Lax';
    }
}

export function getAccessToken() {
    return accessToken;
}

export function getCsrfToken() {
    return csrfToken || readCsrfCookie();
}

export function dropLegacyTokenStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
}
