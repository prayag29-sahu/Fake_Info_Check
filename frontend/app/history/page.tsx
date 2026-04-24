"use client";
import React, { useEffect, useState } from "react";
import { historyApi, HistoryItem } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { Trash2 } from "lucide-react";

function getStatusStyle(verdict: string): string {
    const v = (verdict || "").toLowerCase();
    if (
        v.includes("fake") || v.includes("manipulated") || v.includes("phishing") ||
        v.includes("unsafe") || v.includes("deepfake") || v.includes("forged")
    ) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (v.includes("suspicious") || v.includes("uncertain")) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
}

function formatDate(ts: string): string {
    if (!ts) return "Unknown";
    const date = new Date(ts);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
}

export default function HistoryPage() {
    const { isLoggedIn, loading: authLoading } = useAuth();
    const [scans, setScans] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) { window.location.href = "/login"; return; }

        historyApi
            .getAll()
            .then((res) => setScans(res.data || []))
            .catch(() => setError("Failed to load scan history."))
            .finally(() => setLoading(false));
    }, [isLoggedIn, authLoading]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this scan?")) return;
        setDeleting(id);
        try {
            await historyApi.delete(id);
            setScans((prev) => prev.filter((s) => s.id !== id));
        } catch {
            alert("Failed to delete scan.");
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-4">Scan History</h1>
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Scan History</h1>

            {scans.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                    <p className="text-lg">No scans yet.</p>
                    <p className="text-sm mt-1">Start analyzing content to see results here.</p>
                </div>
            )}

            {/* DESKTOP TABLE */}
            {scans.length > 0 && (
                <div className="hidden lg:block">
                    <div className="bg-white border rounded-xl p-6 dark:bg-gray-800 dark:border-gray-700">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 text-sm">
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Summary</th>
                                    <th className="py-3 px-4">Verdict</th>
                                    <th className="py-3 px-4">Confidence</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {scans.map((s) => {
                                    const verdict = s.overall_verdict || "—";
                                    const conf = s.confidence != null
                                        ? `${Math.round((s.confidence <= 1 ? s.confidence * 100 : s.confidence))}%`
                                        : "—";
                                    return (
                                        <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40">
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 font-medium">
                                                    {s.scan_type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 max-w-xs truncate text-sm">
                                                {s.input_summary || "—"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(verdict)}`}>
                                                    {verdict}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm">{conf}</td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-medium ${s.status === "completed" ? "text-green-500" : s.status === "failed" ? "text-red-500" : "text-yellow-500"}`}>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-500">
                                                {formatDate(s.created_at)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    disabled={deleting === s.id}
                                                    className="text-red-400 hover:text-red-600 disabled:opacity-40"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MOBILE CARDS */}
            {scans.length > 0 && (
                <div className="lg:hidden space-y-4">
                    {scans.map((s) => {
                        const verdict = s.overall_verdict || "—";
                        const conf = s.confidence != null
                            ? Math.round(s.confidence <= 1 ? s.confidence * 100 : s.confidence)
                            : 0;
                        return (
                            <div key={s.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 font-medium">
                                        {s.scan_type}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusStyle(verdict)}`}>
                                        {verdict}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">{s.input_summary || "—"}</p>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{formatDate(s.created_at)}</span>
                                    <span>Confidence: {conf}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
                                    <div
                                        className={`h-full rounded-full ${conf > 70 ? "bg-red-500" : conf > 40 ? "bg-yellow-500" : "bg-green-500"}`}
                                        style={{ width: `${conf}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
