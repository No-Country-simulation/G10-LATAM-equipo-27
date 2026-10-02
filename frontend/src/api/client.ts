import { clearSession, getToken } from "./session";

const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
) {
    const token = getToken();

    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        clearSession();

        if (window.location.pathname !== "/login") {
            window.location.replace("/login");
        }

        throw new Error("La sesión ha expirado");
    }

    if (!response.ok) {
        let message = "Error al comunicarse con el servidor";

        try {
            const error = await response.json();
            message = error.detail || message;
        } catch {
            // La respuesta no contenía JSON
        }

        throw new Error(message);
    }

    return response.json();
}