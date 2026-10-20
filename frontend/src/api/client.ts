import { clearSession, getToken } from "./session";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

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

export async function apiRequestBlob(
  endpoint: string,
): Promise<Blob> {
  const token = getToken()

  if (!token) {
    throw new Error('Debes iniciar sesion para consultar la imagen.')
  }

  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers,
  })

  if (response.status === 401) {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }
    throw new Error('La sesion ha expirado')
  }

  if (!response.ok) {
    throw new Error('No fue posible recuperar la imagen corporativa.')
  }

  const contentType = response.headers.get('content-type') || ''

  if (!contentType.toLowerCase().startsWith('image/png')) {
    throw new Error('El servidor no devolvio una imagen PNG valida.')
  }

  return response.blob()
}
