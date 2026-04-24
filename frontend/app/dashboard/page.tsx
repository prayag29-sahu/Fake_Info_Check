"use client";
import React, { useEffect, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { Scan, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { historyApi, HistoryItem } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const COLORS = ["#8b5cf6", "#facc15", "#06b6d4", "#f87171", "#34d399"];

function buildChartsFromHistory(items: HistoryItem[]) {
    const typeCounts: Record<string, number> = {};
    const dayCounts: Record<string, number> = {
        Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };

    let fakeCount = 0;
    let realCount = 0;

    items.forEach((item) => {
        // scan_type comes from real API
        const type = item.scan_type || "unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        const date = new Date(item.created_at || Date.now());
        const day = date.toLocaleString("default", { weekday: "short" });
        if (dayCounts[day] !== undefined) dayCounts[day]++;

        const verdict = (item.overall_verdict || "").toLowerCase();
        if (
            verdict.includes("fake") ||
            verdict.includes("manipulated") ||
            verdict.includes("phishing") ||
            verdict.includes("unsafe") ||
            verdict.includes("deepfake") ||
            verdict.includes("forged")
        ) {
            fakeCount++;
        } else {
            realCount++;
        }
    });

    const donutData = Object.entries(typeCounts).map(([name, value], i) => ({
        name,
        value,
        color: COLORS[i % COLORS.length],
    }));

    const weeklyData = Object.entries(dayCounts).map(([day, tickets]) => ({
        day,
        tickets,
    }));

    return { donutData, weeklyData, fakeCount, realCount, total: items.length };
}

export default function Dashboard() {
    const { isLoggedIn, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, fakeCount: 0, realCount: 0 });
    const [donutData, setDonutData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [weeklyData, setWeeklyData] = useState<{ day: string; tickets: number }[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) {
            window.location.href = "/login";
            return;
        }
        historyApi
            .getAll(200)
            .then((res) => {
                const items = res.data || [];
                const result = buildChartsFromHistory(items);
                setDonutData(result.donutData);
                setWeeklyData(result.weeklyData);
                setStats({
                    total: result.total,
                    fakeCount: result.fakeCount,
                    realCount: result.realCount,
                });
            })
            .catch(() => setError("Failed to load dashboard data."))
            .finally(() => setLoading(false));
    }, [isLoggedIn, authLoading]);

    const statCards = [
        {
            label: "Total Scans",
            value: loading ? "…" : String(stats.total),
            bg: "from-purple-500 to-pink-500",
            icon: <Scan className="w-6 h-6 text-white" />,
        },
        {
            label: "Fake / Unsafe Detected",
            value: loading ? "…" : String(stats.fakeCount),
            bg: "from-red-400 to-orange-400",
            icon: <AlertTriangle className="w-6 h-6 text-white" />,
        },
        {
            label: "Clean Results",
            value: loading ? "…" : String(stats.realCount),
            bg: "from-cyan-400 to-blue-500",
            icon: <CheckCircle className="w-6 h-6 text-white" />,
        },
        {
            label: "Detection Rate",
            value:
                loading || stats.total === 0
                    ? "…"
                    : `${Math.round((stats.fakeCount / stats.total) * 100)}%`,
            bg: "from-purple-400 to-blue-400",
            icon: <TrendingUp className="w-6 h-6 text-white" />,
        },
    ];

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* DESKTOP */}
            <div className="hidden lg:block space-y-10">
                <h1 className="text-4xl font-bold">Dashboard</h1>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((s, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl p-6 text-white bg-gradient-to-br ${s.bg} shadow-xl`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="text-3xl font-bold">{s.value}</div>
                                <div className="p-3 rounded-xl bg-white/20">{s.icon}</div>
                            </div>
                            <p className="mt-3 text-white/80">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="bg-[#1a1a2e] rounded-2xl p-6 shadow-xl border border-white/5">
                        <h2 className="text-xl text-white font-bold mb-4">Scan Types Distribution</h2>
                        {loading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : donutData.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-gray-400">
                                No data yet
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        dataKey="value"
                                        data={donutData}
                                        innerRadius={60}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {donutData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="bg-[#1a1a2e] rounded-2xl p-6 shadow-lg">
                        <h2 className="text-xl text-white font-bold mb-4">Scans per Day of Week</h2>
                        {loading ? (
                            <div className="h-[260px] flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={weeklyData}>
                                    <XAxis dataKey="day" stroke="#ccc" />
                                    <YAxis stroke="#ccc" allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="tickets" fill="#facc15" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* MOBILE */}
            <div className="lg:hidden block space-y-6 px-4 pt-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="grid grid-cols-2 gap-4">
                    {statCards.map((s, i) => (
                        <div
                            key={i}
                            className={`rounded-xl p-4 text-white bg-gradient-to-br ${s.bg} shadow`}
                        >
                            <div className="text-xl font-bold">{s.value}</div>
                            <p className="text-white/90 text-sm">{s.label}</p>
                        </div>
                    ))}
                </div>

                {!loading && donutData.length > 0 && (
                    <div className="bg-[#1a1a2e] rounded-xl p-4">
                        <h2 className="text-lg text-white font-semibold mb-3">Scan Types</h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={donutData} innerRadius={40} outerRadius={80} dataKey="value">
                                    {donutData.map((d, i) => (
                                        <Cell key={i} fill={d.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
