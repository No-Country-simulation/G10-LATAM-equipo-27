import { apiRequest } from "./client";

export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    role: string | null;
}

export async function getUsers(): Promise<User[]> {
    return apiRequest("/api/v1/users/", {
        method: "GET",
    });
}

export async function updateUserRole(
    userId: number,
    role: string
): Promise<User> {
    const response = await apiRequest(
        `/api/v1/users/${userId}/role`,
        {
            method: "PATCH",
            body: JSON.stringify({
                role,
            }),
        }
    );

    return response.user;
}

export async function updateUserStatus(
    userId: number,
    isActive: boolean
): Promise<User> {
    const response = await apiRequest(
        `/api/v1/users/${userId}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({
                is_active: isActive,
            }),
        }
    );

    return response.user;
}

export interface CreateUserData {
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
}
export async function createUser(
    data: CreateUserData
): Promise<User> {
    const response = await apiRequest(
        "/api/v1/users/register",
        {
            method: "POST",
            body: JSON.stringify(data),
        }
    );

    return response.user;
}

export async function updateUserName(
    userId: number,
    firstName: string,
    lastName: string
): Promise<User> {
    const response = await apiRequest(
        `/api/v1/users/${userId}/name`,
        {
            method: "PATCH",
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
            }),
        }
    );

    return response.user;
}

export async function resetUserPassword(
    userId: number,
    newPassword: string
): Promise<void> {
    await apiRequest(
        `/api/v1/users/${userId}/password`,
        {
            method: "PATCH",
            body: JSON.stringify({
                new_password: newPassword,
            }),
        }
    );
}


export async function deleteUser(
    userId: number
): Promise<void> {
    await apiRequest(
        `/api/v1/users/${userId}`,
        {
            method: "DELETE",
        }
    );
}