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
}