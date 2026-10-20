import { apiRequest } from "./client";

export interface OCIStorageStatus {
    status: string;
    message: string;
}

export interface WeeklyPeriod {
    start_date: string;
    end_date: string;
    status: string;
}

export async function getOCIStorageStatus(): Promise<OCIStorageStatus> {
    return apiRequest(
        "/api/v1/oci-storage/status",
        {
            method: "GET",
        }
    );
}

export async function getWeeklyPeriod(): Promise<WeeklyPeriod> {
    return apiRequest(
        "/api/v1/oci-storage/weekly-period",
        {
            method: "GET",
        }
    );
}

export interface WeeklySyncResponse {
    status: string;
    message: string;
    sync_id: number;
    start_date?: string;
    end_date?: string;
}

export async function startWeeklySync(): Promise<WeeklySyncResponse> {
    return apiRequest(
        "/api/v1/oci-storage/weekly-sync",
        {
            method: "POST",
        }
    );
}export interface OCIJsonObject {
    name: string;
    size: number | null;
    time_created: string | null;
}

export interface OCIJsonObjectsResponse {
    objects: OCIJsonObject[];
}

export interface OCIJsonContentResponse {
    object_name: string;
    content: unknown;
}

export async function listOCIJsonObjects(
    prefix = "",
    limit = 100
): Promise<OCIJsonObjectsResponse> {
    const params = new URLSearchParams({
        prefix,
        limit: String(limit),
    });

    return apiRequest(
        `/api/v1/oci-storage/objects?${params.toString()}`,
        { method: "GET" }
    );
}

export async function getOCIJsonObject(
    objectName: string
): Promise<OCIJsonContentResponse> {
    const params = new URLSearchParams({
        object_name: objectName,
    });

    return apiRequest(
        `/api/v1/oci-storage/objects/content?${params.toString()}`,
        { method: "GET" }
    );
}


export interface WeeklyReport {
    semana: string;
    nombre_archivo?: string;
    archivo?: string;
    status?: string;
    storage_status?: string;
    size?: number;
    reporte?: unknown;
}

export interface WeeklyReportsResponse {
    reports: WeeklyReport[];
}

export async function listWeeklyReports(): Promise<WeeklyReportsResponse> {
    return apiRequest("/api/v1/oci-storage/reports", { method: "GET" });
}


export interface NotificationSettings {
    enabled: boolean;
    daily: boolean;
    weekly: boolean;
    notificationEmailEnabled: boolean;
    notificationWebhookEnabled: boolean;
    email: string;
    webhook: string;
    format: string;
    webhook_configured?: boolean;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
    return apiRequest("/api/v1/oci-storage/notification-settings", {
        method: "GET",
    });
}

export async function saveNotificationSettings(
    settings: NotificationSettings
): Promise<NotificationSettings> {
    return apiRequest("/api/v1/oci-storage/notification-settings", {
        method: "PUT",
        body: JSON.stringify(settings),
    });
}


export interface ManualJsonUploadResponse {
    status: string;
    filename: string;
    size: number;
    storage: string;
    message: string;
}

export async function uploadManualJson(
    file: File
): Promise<ManualJsonUploadResponse> {
    const body = new FormData();
    body.append("file", file);

    return apiRequest("/api/v1/oci-storage/manual-upload", {
        method: "POST",
        body,
    });
}
