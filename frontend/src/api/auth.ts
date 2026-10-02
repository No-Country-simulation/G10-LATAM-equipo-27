import { apiRequest } from "./client";

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role: string | null;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: AuthUser;
}

export async function login(
    credentials: LoginCredentials
): Promise<LoginResponse> {
    return apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
}

export async function getCurrentUser(): Promise<AuthUser> {
    return apiRequest("/api/v1/auth/me", {
        method: "GET",
    });
}