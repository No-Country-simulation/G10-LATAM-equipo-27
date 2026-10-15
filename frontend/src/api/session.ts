import type { AuthUser } from "./auth";

const TOKEN_KEY = "communitylab_token";
const USER_KEY = "communitylab_user";

export function saveSession(
    token: string,
    user: AuthUser
): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
    const user = sessionStorage.getItem(USER_KEY);

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user) as AuthUser;
    } catch {
        clearSession();
        return null;
    }
}

export function clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}