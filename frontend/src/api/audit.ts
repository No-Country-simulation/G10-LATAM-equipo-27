import { apiRequest } from "./client";

export interface AuditLog {
    id: number;
    user_id: number | null;
    username: string | null;
    action: string;
    resource_type: string;
    resource_id: string | null;
    details: string | null;
    created_at: string;
    
}

export async function getAuditLogs(
    limit: number = 100,
    offset: number = 0,
    days: number = 7,
    action?: string,
    userId?: number
): Promise<AuditLog[]> {
    const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        days: String(days),
    });
    

    if (action) {
        params.set("action", action);
    }


    if (userId) {
        params.set("user_id", String(userId));
    }

    return apiRequest(
        `/api/v1/audit/?${params.toString()}`,
        {
            method: "GET",
        }
    );
}