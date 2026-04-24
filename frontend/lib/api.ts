/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api.ts

import { getToken, removeToken } from "./auth";

const BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiOptions {
    method?: RequestMethod;
    body?: Record<string, unknown> | FormData;
    isFormData?: boolean;
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

export async function apiRequest<T = unknown>(
    endpoint: string,
    options: ApiOptions = {}
): Promise<T> {
    const { method = "GET", body, isFormData = false } = options;
    const token = getToken();

    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!isFormData) headers["Content-Type"] = "application/json";

    const config: RequestInit = { method, headers };
    if (body) {
        config.body = isFormData
            ? (body as unknown as FormData)
            : JSON.stringify(body);
    }

    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, config);
    } catch (err: any) {
        throw new ApiError(0, err.message || "Network error — is the backend running?");
    }

    if (response.status === 401) {
        removeToken();
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new ApiError(401, "Session expired. Please login again.");
    }

    if (!response.ok) {
        let errorMessage = `Request failed (${response.status})`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
        } catch {
            // use default
        }
        throw new ApiError(response.status, errorMessage);
    }

    try {
        return (await response.json()) as T;
    } catch {
        return {} as T;
    }
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const authApi = {
    signup: (data: { email: string; password: string; full_name: string }) =>
        apiRequest<{ success: boolean; user: any; message: string }>("/auth/signup", {
            method: "POST",
            body: data,
        }),

    login: (data: { email: string; password: string }) =>
        apiRequest<{
            success: boolean;
            session: { access_token: string; expires_at: number; user: any };
        }>("/auth/login", { method: "POST", body: data }),

    getProfile: () =>
        apiRequest<{ success: boolean; data: ProfileData }>("/auth/profile"),

    logout: () =>
        apiRequest("/auth/logout", { method: "POST" }),
};

// ─── CHECK ENDPOINTS ─────────────────────────────────────────────────────────

export const checkApi = {
    text: (text: string) =>
        apiRequest<{ success: boolean; data: CheckResponse; scan_id: string }>(
            "/text/check",
            { method: "POST", body: { text } }
        ),

    url: (url: string) =>
        apiRequest<{ success: boolean; data: CheckResponse; scan_id: string }>(
            "/url/check",
            { method: "POST", body: { url } }
        ),

    image: (file: File) => {
        const fd = new FormData();
        fd.append("image", file);
        return apiRequest<{ success: boolean; data: CheckResponse; scan_id: string; file_url?: string }>(
            "/image/check",
            { method: "POST", body: fd as any, isFormData: true }
        );
    },

    video: (file: File) => {
        const fd = new FormData();
        fd.append("video", file);
        return apiRequest<{ success: boolean; data: CheckResponse; scan_id: string; file_url?: string }>(
            "/video/check",
            { method: "POST", body: fd as any, isFormData: true }
        );
    },

    document: (file: File) => {
        const fd = new FormData();
        fd.append("document", file);
        return apiRequest<{ success: boolean; data: CheckResponse; scan_id: string; file_url?: string }>(
            "/document/check",
            { method: "POST", body: fd as any, isFormData: true }
        );
    },
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export const profileApi = {
    get: () =>
        apiRequest<{ success: boolean; data: ProfileData }>("/profile"),

    update: (data: Partial<ProfileData>) =>
        apiRequest<{ success: boolean; data: ProfileData }>("/profile", {
            method: "PUT",
            body: data,
        }),
};

// ─── HISTORY ─────────────────────────────────────────────────────────────────

export const historyApi = {
    getAll: (limit = 50, offset = 0) =>
        apiRequest<{ success: boolean; data: HistoryItem[] }>(
            `/history?limit=${limit}&offset=${offset}`
        ),

    delete: (id: string) =>
        apiRequest<{ success: boolean; message: string }>(`/history/${id}`, {
            method: "DELETE",
        }),
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface CheckResponse {
    label: "fake" | "real" | "uncertain" | "phishing" | "safe" | "unsafe" | "suspicious" | "deepfake" | "original" | "manipulated" | "authentic" | "forged";
    confidence: number;
    indicators?: string[];
    explanation?: string;
    // image-specific
    ela_score?: number;
    noise_level?: number;
    // video-specific
    frames_analyzed?: number;
    total_frames?: number;
    avg_ela_score?: number;
    // url-specific
    threat_type?: string;
    // document-specific
    extracted_data?: {
        text_preview?: string;
        word_count?: number;
        char_count?: number;
        filename?: string;
    };
}

export interface ProfileData {
    id?: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
    role?: string;
    created_at?: string;
}

export interface HistoryItem {
    id: string;
    scan_type: "text" | "image" | "video" | "url" | "document";
    input_summary?: string;
    overall_verdict?: string;
    confidence?: number;
    status: "processing" | "completed" | "failed";
    created_at: string;
    scan_results?: Array<{
        verdict: string;
        confidence: number;
        indicators?: string[];
    }>;
}
