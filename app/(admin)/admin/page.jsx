"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getPlatformStatsAction, getPaginatedGlobalActivityAction } from "@/actions/admin";
import { useNotification } from "@/components/NotificationContext";
import {
    Users, BarChart3, CreditCard, Activity, RefreshCw,
    ArrowUpRight, ArrowDownLeft, TrendingUp, Zap,
} from "lucide-react";

// ── Mini SVG Area Chart ──────────────────────────────────────────────────────
function MiniSparkline({ values = [], color = "#6366f1" }) {
    if (!values.length) return null;
    const max = Math.max(...values, 1);
    const w = 200, h = 50, pad = 4;
    const pts = values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = h - pad - (v / max) * (h - pad * 2);
        return `${x},${y}`;
    });
    const areaPath = `M${pts.join(" L")} L${w - pad},${h - pad} L${pad},${h - pad} Z`;
    const linePath = `M${pts.join(" L")}`;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#sg-${color.replace('#','')})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, iconBg, delta, sparkValues, color }) {
    return (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className="w-4.5 h-4.5" size={18} />
                </div>
                {delta && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">
                        <TrendingUp className="w-3 h-3" /> {delta}
                    </span>
                )}
            </div>
            <div>
                <p className="text-slate-500 text-xs font-medium mb-0.5">{label}</p>
                <p className="text-white text-2xl font-black tracking-tight">{value}</p>
            </div>
            {sparkValues && (
                <div className="h-8 -mx-1">
                    <MiniSparkline values={sparkValues} color={color} />
                </div>
            )}
        </div>
    );
}

// ── Type Badge ────────────────────────────────────────────────────────────────
function TxBadge({ type }) {
    const cfg = {
        FUNDING:     { cls: "bg-emerald-900/40 text-emerald-400", label: "Funding",     icon: <ArrowDownLeft className="w-3 h-3" /> },
        SERVICE_FEE: { cls: "bg-indigo-900/40 text-indigo-400",   label: "Service Fee", icon: <ArrowUpRight className="w-3 h-3" /> },
        DEBIT:       { cls: "bg-rose-900/40 text-rose-400",       label: "Debit",       icon: <ArrowUpRight className="w-3 h-3" /> },
    };
    const c = cfg[type] || { cls: "bg-slate-800 text-slate-400", label: type, icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>
            {c.icon}{c.label}
        </span>
    );
}

export default function AdminOverviewPage() {
    const { showNotification } = useNotification();
    const router = useRouter();
    const { user, loading, isAuthenticated } = useAuth();
    const [stats, setStats] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [activityPage, setActivityPage] = useState(1);
    const [activityData, setActivityData] = useState({ transactions: [], total: 0 });
    const [fetchingActivity, setFetchingActivity] = useState(false);
    const pageSize = 10;

    // Ref to always hold the latest fetchStats without triggering channel re-subscription
    const fetchStatsRef = useRef(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) router.push("/auth/login");
    }, [loading, isAuthenticated, router]);

    const fetchActivity = useCallback(async (page) => {
        setFetchingActivity(true);
        const res = await getPaginatedGlobalActivityAction(page, pageSize);
        if (res.success) {
            setActivityData({ transactions: res.transactions, total: res.total });
            setActivityPage(page);
        }
        setFetchingActivity(false);
    }, [pageSize]);

    const fetchStats = useCallback(async () => {
        setFetching(true);
        const res = await getPlatformStatsAction();
        if (res.success) {
            setStats(res.stats);
            fetchActivity(1);
        } else {
            showNotification(res.error, "error");
        }
        setFetching(false);
    }, [fetchActivity, showNotification]);

    // Keep the ref up-to-date with the latest fetchStats on every render
    fetchStatsRef.current = fetchStats;

    // Initial data load
    useEffect(() => {
        if (!loading && isAuthenticated) {
            fetchStats();
        }
    }, [loading, isAuthenticated, fetchStats]);

    /**
     * Focus-Aware Intelligent Polling
     * - Refresh data when tab becomes visible or gains focus.
     * - Background interval (2-min) that ONLY runs when tab is active.
     */
    useEffect(() => {
        if (!loading && isAuthenticated) {
            const SMART_POLL_INTERVAL = 120000; // 2 minutes (conservative for free tier)
            let pollTimer = null;

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    console.log("[Smart Refresh] Tab focused. Refreshing data...");
                    fetchStatsRef.current?.();
                    
                    // Restart background poll timer
                    if (!pollTimer) {
                        pollTimer = setInterval(() => {
                            if (document.visibilityState === 'visible') {
                                console.log("[Smart Refresh] Active interval check.");
                                fetchStatsRef.current?.();
                            }
                        }, SMART_POLL_INTERVAL);
                    }
                } else if (pollTimer) {
                    // Stop polling completely if backgrounded to save resources
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
            };

            // Setup initial timer if visible
            if (document.visibilityState === 'visible') {
                pollTimer = setInterval(() => {
                    fetchStatsRef.current?.();
                }, SMART_POLL_INTERVAL);
            }

            window.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('focus', handleVisibilityChange);

            return () => {
                window.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('focus', handleVisibilityChange);
                if (pollTimer) clearInterval(pollTimer);
            };
        }
    }, [loading, isAuthenticated]);

    const totalPages = Math.ceil(activityData.total / pageSize);

    if (loading || (fetching && !stats)) {
        return (
            <div className="flex flex-col h-screen bg-slate-950">
                <AdminTopBar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-500 text-sm animate-pulse">Loading platform data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            <AdminTopBar onRefresh={fetchStats} isRefreshing={fetching} />

            <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">

                {/* KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        label="Registered Users" value={stats?.users?.toLocaleString() ?? "—"}
                        icon={Users} iconBg="bg-blue-900/40 text-blue-400" delta="+Active"
                        color="#60a5fa"
                    />
                    <KpiCard
                        label="Platform Revenue" value={`₦${stats?.revenue?.toLocaleString() ?? "0"}`}
                        icon={BarChart3} iconBg="bg-indigo-900/40 text-indigo-400" delta="LIVE"
                        color="#818cf8"
                    />
                    <KpiCard
                        label="Total Wallet Funding" value={`₦${stats?.funding?.toLocaleString() ?? "0"}`}
                        icon={CreditCard} iconBg="bg-amber-900/40 text-amber-400"
                        color="#fbbf24"
                    />
                    <KpiCard
                        label="Total Transactions" value={stats?.transactions?.toLocaleString() ?? "—"}
                        icon={Activity} iconBg="bg-purple-900/40 text-purple-400"
                        color="#c084fc"
                    />
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Activity Table (2/3) */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-indigo-400" />
                                <h2 className="text-sm font-bold text-white">Global Activity Feed</h2>
                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> LIVE
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] text-slate-500">Smart Refresh (Active Only)</span>
                                <button
                                    onClick={fetchStats}
                                    disabled={fetching || fetchingActivity}
                                    className="p-1.5 rounded-md text-slate-500 hover:text-indigo-400 hover:bg-slate-800 transition-all disabled:opacity-20"
                                    title="Manual Refresh activity"
                                >
                                    <RefreshCw className={`w-3 h-3 ${(fetching || fetchingActivity) ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                        </div>

                        <div className={`overflow-x-auto transition-opacity duration-300 ${fetchingActivity ? "opacity-50" : ""}`}>
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                        <th className="px-6 py-3">User</th>
                                        <th className="px-6 py-3">Type</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                        <th className="px-6 py-3 hidden md:table-cell">Reference</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {activityData.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-200">
                                                        {tx.wallet?.user?.first_name
                                                            ? `${tx.wallet.user.first_name} ${tx.wallet.user.last_name}`
                                                            : "Unknown"}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500">{tx.wallet?.user?.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><TxBadge type={tx.type} /></td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-bold ${tx.type === "FUNDING" ? "text-emerald-400" : "text-slate-300"}`}>
                                                    {tx.type === "FUNDING" ? "+" : ""}₦{Math.abs(tx.amount).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell font-mono text-[10px] text-slate-500">
                                                {tx.reference?.slice(0, 14) || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/50">
                            <p className="text-[10px] text-slate-500">
                                {(activityPage - 1) * pageSize + 1}–{Math.min(activityPage * pageSize, activityData.total)} of {activityData.total}
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => fetchActivity(activityPage - 1)}
                                    disabled={activityPage === 1 || fetchingActivity}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white hover:bg-slate-700 transition-all"
                                >Prev</button>
                                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => fetchActivity(i + 1)}
                                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                            activityPage === i + 1
                                                ? "bg-indigo-600 text-white"
                                                : "text-slate-500 hover:bg-slate-800 hover:text-white"
                                        }`}
                                    >{i + 1}</button>
                                ))}
                                {totalPages > 5 && <span className="text-slate-600 text-xs">…</span>}
                                <button
                                    onClick={() => fetchActivity(activityPage + 1)}
                                    disabled={activityPage >= totalPages || fetchingActivity}
                                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:text-white hover:bg-slate-700 transition-all"
                                >Next</button>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">
                        {/* Quick actions */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Quick Actions</p>
                            <div className="space-y-2">
                                {[
                                    { label: "Manage Users", href: "/admin/users", color: "bg-blue-600 hover:bg-blue-700" },
                                    { label: "View Analytics", href: "/admin/analytics", color: "bg-indigo-600 hover:bg-indigo-700" },
                                    { label: "Identity Logs", href: "/admin/verifications", color: "bg-slate-700 hover:bg-slate-600" },
                                    { label: "All Transactions", href: "/admin/transactions", color: "bg-slate-700 hover:bg-slate-600" },
                                ].map(a => (
                                    <a key={a.href} href={a.href}
                                        className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold text-white transition-all ${a.color}`}
                                    >
                                        {a.label}
                                        <ArrowUpRight className="w-4 h-4 opacity-60" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Platform tip */}
                        <div className="bg-indigo-900/20 border border-indigo-800/40 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-indigo-400" />
                                <p className="text-xs font-bold text-indigo-300">Admin Tip</p>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                All platform transactions are ACID-compliant. Revenue figures are calculated directly from SERVICE_FEE transactions in real time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
