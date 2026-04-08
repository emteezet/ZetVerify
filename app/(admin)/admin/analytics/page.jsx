"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getRevenueChartDataAction, getVerificationChartDataAction, getPlatformStatsAction } from "@/actions/admin";
import { useNotification } from "@/components/NotificationContext";
import { TrendingUp, ShieldCheck, Users, BarChart3 } from "lucide-react";

// ── SVG Area Chart (Revenue) ─────────────────────────────────────────────────
function AreaChart({ data = [], color = "#6366f1" }) {
    if (!data.length) return <div className="h-full flex items-center justify-center text-slate-600 text-sm">No data yet</div>;
    const vals = data.map(d => d.value);
    const max = Math.max(...vals, 1);
    const W = 600, H = 120, PAD = 12;
    const pts = vals.map((v, i) => {
        const x = PAD + (i / (vals.length - 1)) * (W - PAD * 2);
        const y = H - PAD - (v / max) * (H - PAD * 2);
        return [x, y];
    });
    const linePath = `M${pts.map(p => p.join(",")).join(" L")}`;
    const areaPath = `${linePath} L${pts[pts.length - 1][0]},${H - PAD} L${pts[0][0]},${H - PAD} Z`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1].map(f => (
                <line key={f} x1={PAD} y1={H - PAD - f * (H - PAD * 2)} x2={W - PAD} y2={H - PAD - f * (H - PAD * 2)}
                    stroke="#1e293b" strokeWidth="1" />
            ))}
            <path d={areaPath} fill="url(#areaGrad)" />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Dots on data points */}
            {pts.filter((_, i) => i % 5 === 0).map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3" fill={color} />
            ))}
        </svg>
    );
}

// ── SVG Bar Chart (Verifications) ────────────────────────────────────────────
function BarChart({ data = [] }) {
    if (!data.length) return <div className="h-full flex items-center justify-center text-slate-600 text-sm">No data yet</div>;
    const maxVal = Math.max(...data.map(d => d.nin + d.bvn), 1);
    const W = 600, H = 120, PAD = 12;
    const barW = Math.max(2, (W - PAD * 2) / data.length - 2);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
            {data.map((d, i) => {
                const x = PAD + i * ((W - PAD * 2) / data.length);
                const totalH = ((d.nin + d.bvn) / maxVal) * (H - PAD * 2);
                const ninH = (d.nin / (d.nin + d.bvn || 1)) * totalH;
                const bvnH = totalH - ninH;
                return (
                    <g key={i}>
                        <rect x={x} y={H - PAD - totalH} width={barW} height={ninH} fill="#6366f1" rx="1" opacity="0.85" />
                        <rect x={x} y={H - PAD - bvnH} width={barW} height={bvnH} fill="#22d3ee" rx="1" opacity="0.65" />
                    </g>
                );
            })}
        </svg>
    );
}

// ── Donut Ring (Service split) ────────────────────────────────────────────────
function DonutRing({ nin, bvn }) {
    const total = nin + bvn || 1;
    const ninPct = (nin / total) * 100;
    const circ = 2 * Math.PI * 40;
    const ninDash = (ninPct / 100) * circ;
    return (
        <svg viewBox="0 0 100 100" className="w-32 h-32">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="14" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#6366f1" strokeWidth="14"
                strokeDasharray={`${ninDash} ${circ - ninDash}`} strokeDashoffset={circ * 0.25}
                strokeLinecap="round" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="14"
                strokeDasharray={`${circ - ninDash} ${ninDash}`}
                strokeDashoffset={circ * 0.25 - ninDash}
                strokeLinecap="round" />
            <text x="50" y="47" textAnchor="middle" fill="white" fontSize="11" fontWeight="900">{Math.round(ninPct)}%</text>
            <text x="50" y="58" textAnchor="middle" fill="#94a3b8" fontSize="7">NIN</text>
        </svg>
    );
}

export default function AdminAnalyticsPage() {
    const { showNotification } = useNotification();
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    const [revenueData, setRevenueData] = useState([]);
    const [verifData, setVerifData] = useState(null);
    const [stats, setStats] = useState(null);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !isAuthenticated) router.push("/auth/login");
    }, [loading, isAuthenticated]);

    const load = async () => {
        setFetching(true);
        const [rRes, vRes, sRes] = await Promise.all([
            getRevenueChartDataAction(),
            getVerificationChartDataAction(),
            getPlatformStatsAction(),
        ]);
        if (rRes.success) setRevenueData(rRes.data);
        else showNotification(rRes.error, "error");
        if (vRes.success) setVerifData(vRes.data);
        if (sRes.success) setStats(sRes.stats);
        setFetching(false);
    };

    useEffect(() => {
        if (!loading && isAuthenticated) load();
    }, [loading, isAuthenticated]);

    const totalRevenue30 = revenueData.reduce((s, d) => s + d.value, 0);
    const totalVerifs30 = verifData ? verifData.daily.reduce((s, d) => s + d.nin + d.bvn, 0) : 0;
    const avgRevPerDay = revenueData.length ? (totalRevenue30 / 30).toFixed(0) : 0;

    if (fetching) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-950">
                <AdminTopBar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            <AdminTopBar onRefresh={load} isRefreshing={fetching} />

            <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">

                {/* Platform Health KPIs row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Revenue (30d)", value: `₦${totalRevenue30.toLocaleString()}`, icon: TrendingUp, cls: "bg-indigo-900/40 text-indigo-400" },
                        { label: "Avg Revenue/Day", value: `₦${Number(avgRevPerDay).toLocaleString()}`, icon: BarChart3, cls: "bg-purple-900/40 text-purple-400" },
                        { label: "Verifications (30d)", value: totalVerifs30.toLocaleString(), icon: ShieldCheck, cls: "bg-cyan-900/40 text-cyan-400" },
                        { label: "Total Users", value: stats?.users?.toLocaleString() ?? "—", icon: Users, cls: "bg-blue-900/40 text-blue-400" },
                    ].map(k => (
                        <div key={k.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.cls}`}>
                                <k.icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">{k.label}</p>
                                <p className="text-xl font-black text-white">{k.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue chart */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-white">Revenue Over Time</h2>
                                <p className="text-[10px] text-slate-500 mt-0.5">Daily service fees — last 30 days</p>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded-full">SERVICE_FEE</span>
                        </div>
                        <div className="h-32">
                            <AreaChart data={revenueData} color="#6366f1" />
                        </div>
                        <div className="flex justify-between mt-3 text-[9px] text-slate-600 font-mono">
                            <span>{revenueData[0]?.date?.slice(5)}</span>
                            <span>{revenueData[revenueData.length - 1]?.date?.slice(5)}</span>
                        </div>
                    </div>

                    {/* Verification volume chart */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-white">Verification Volume</h2>
                                <p className="text-[10px] text-slate-500 mt-0.5">Daily NIN + BVN — last 30 days</p>
                            </div>
                            <div className="flex items-center gap-3 text-[9px] font-bold">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500 inline-block" />NIN</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />BVN</span>
                            </div>
                        </div>
                        <div className="h-32">
                            <BarChart data={verifData?.daily || []} />
                        </div>
                    </div>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Service split donut */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center gap-4">
                        <h2 className="text-sm font-bold text-white self-start">Service Breakdown</h2>
                        <DonutRing nin={verifData?.ninTotal ?? 0} bvn={verifData?.bvnTotal ?? 0} />
                        <div className="flex gap-6 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                                <span className="text-slate-400">NIN <span className="text-white font-bold">{verifData?.ninTotal ?? 0}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-sm bg-cyan-400 inline-block" />
                                <span className="text-slate-400">BVN <span className="text-white font-bold">{verifData?.bvnTotal ?? 0}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Top spenders */}
                    <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-6">
                        <h2 className="text-sm font-bold text-white mb-5">Top 5 Spenders</h2>
                        <div className="space-y-3">
                            {(verifData?.topSpenders ?? []).length === 0 && (
                                <p className="text-slate-600 text-sm italic">No spending data yet.</p>
                            )}
                            {(verifData?.topSpenders ?? []).map((s, i) => {
                                const max = verifData.topSpenders[0]?.total || 1;
                                const pct = (s.total / max) * 100;
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-500 w-4 text-center">{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-xs font-semibold text-slate-300 truncate max-w-[60%]">{s.name}</span>
                                                <span className="text-xs font-black text-indigo-400">₦{s.total.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                                                    style={{ width: `${pct}%`, transition: "width 0.8s ease" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
