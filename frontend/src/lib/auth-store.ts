/**
 * Auth storage helpers — uses localStorage when "Remember Me" is checked,
 * sessionStorage otherwise. Reads from both (localStorage first).
 */

const TOKEN_KEY = "lectra_token";
const USER_KEY = "lectra_user";
const REMEMBER_KEY = "lectra_remember";

function getStore(): Storage {
    if (typeof window === "undefined") return localStorage; // SSR fallback
    return localStorage.getItem(REMEMBER_KEY) === "true" ? localStorage : sessionStorage;
}

/** Save auth data. Call with remember=true to persist across browser restarts. */
export function saveAuth(token: string, user: object, remember: boolean) {
    // Clear both first
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    const store = remember ? localStorage : sessionStorage;
    localStorage.setItem(REMEMBER_KEY, String(remember));
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));
}

/** Get the auth token (checks both storages). */
export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/** Get the stored user object (checks both storages). */
export function getUser(): { full_name?: string; email?: string } | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

/** Clear all auth data (sign out). */
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}
