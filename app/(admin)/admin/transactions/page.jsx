"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getPaginatedGlobalActivityAction } from "@/actions/admin";
import { useNotification } from "@/components/NotificationContext";
import { ArrowUpRight, ArrowDownLeft, Search, DollarSign, TrendingUp, CreditCard } from "lucide-react";

const TYPE_FILTERS = ["ALL", "FUNDING", "SERVICE_FEE", "DEBIT"];

const TYPE_CONFIG = {
    FUNDING:     { cls: "bg-emerald-900/40 text-emerald-400", label: "Funding",     icon: <ArrowDownLeft className="w-3 h-3" /> },
    SERVICE_FEE: { cls: "bg-indigo-900/40 text-indigo-400",   label: "Service Fee", icon: <ArrowUpRight className="w-3 h-3" /> },
    DEBIT:       { cls: "bg-rose-900/40 text-rose-400",       label: "Debit",       icon: <ArrowUpRight className="w-3 h-3" /> },
};

function TxBadge({ type }) {
    const c = TYPE_CONFIG[type] || { cls: "bg-slate-800 text-slate-400", label: type, icon: null };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>
            {c.icon}{c.label}
        </span>
    );
}

export default function AdminTransactionsPage() {
    const { showNotification } = useNotification();
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    const [allTx, setAllTx] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [fetching, setFetching] = useState(true);
    const [filterType, setFilterType] = useState("ALL");
    const [search, setSearch] = useState("");
    const pageSize = 15;

    useEffect(() => {
        if (!loading && !isAuthenticated) router.push("/auth/login");
    }, [loading, isAuthenticated]);

    const loadPage = async (p) => {
        setFetching(true);
        const res = await getPaginatedGlobalActivityAction(p, pageSize);
        if (res.success) {
            setAllTx(res.transactions);
            setTotal(res.total);
            setPage(p);
        } else {
            showNotification(res.error, "error");
        }
        setFetching(false);
    };

    useEffect(() => {
        if (!loading && isAuthenticated) loadPage(1);
    }, [loading, isAuthenticated]);

    // Client-side filter + search
    const filtered = allTx.filter(tx => {
        const typeMatch = filterType === "ALL" || tx.type === filterType;
        const q = search.toLowerCase();
        const emailMatch = tx.wallet?.user?.email?.toLowerCase().includes(q);
        const refMatch = tx.reference?.toLowerCase().includes(q);
        const nameMatch = `${tx.wallet?.user?.first_name || ""} ${tx.wallet?.user?.last_name || ""}`.toLowerCase().includes(q);
        return typeMatch && (!q || emailMatch || refMatch || nameMatch);
    });

    // Summary stats
    const totalFunding = allTx.filter(t => t.type === "FUNDING").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const totalRevenue = allTx.filter(t => t.type === "SERVICE_FEE").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const totalVolume = allTx.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            <AdminTopBar />

            <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">

                {/* Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: "Total Volume", value: `₦${totalVolume.toLocaleString()}`, icon: DollarSign, cls: "bg-slate-800 text-slate-300" },
                        { label: "Total Fundings", value: `₦${totalFunding.toLocaleString()}`, icon: ArrowDownLeft, cls: "bg-emerald-900/30 text-emerald-400" },
                        { label: "Platform Revenue", value: `₦${totalRevenue.toLocaleString()}`, icon: TrendingUp, cls: "bg-indigo-900/30 text-indigo-400" },
                    ].map(k => (
                        <div key={k.label} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.cls}`}>
                                <k.icon size={18} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">{k.label}</p>
                                <p className="text-lg font-black text-white">{k.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls bar */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                    {/* Type filter tabs */}
                    <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                        {TYPE_FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterType(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    filterType === f
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                                        : "text-slate-500 hover:text-white"
                                }`}
                            >
                                {f === "SERVICE_FEE" ? "Fee" : f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search email or reference..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-opacity duration-200 ${fetching ? "opacity-60" : ""}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 hidden md:table-cell">Reference</th>
                                    <th className="px-6 py-3 hidden lg:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <CreditCard className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">{search || filterType !== "ALL" ? "No results found." : "No transactions yet."}</p>
                                        </td>
                                    </tr>
                                ) : filtered.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-200">
                                                    {tx.wallet?.user?.first_name
                                                        ? `${tx.wallet.user.first_name} ${tx.wallet.user.last_name}`
                                                        : "Unknown User"}
                                                </p>
                                                <p className="text-[10px] text-slate-500">{tx.wallet?.user?.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><TxBadge type={tx.type} /></td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${tx.type === "FUNDING" ? "text-emerald-400" : "text-slate-300"}`}>
                                                {tx.type === "FUNDING" ? "+" : ""}₦{Math.abs(Number(tx.amount)).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="font-mono text-[10px] text-slate-500">{tx.reference?.slice(0, 16) || "—"}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-xs text-slate-500">
                                            {new Date(tx.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</p>
                        <div className="flex gap-1">
                            <button onClick={() => loadPage(page - 1)} disabled={page === 1 || fetching}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:bg-slate-700 hover:text-white transition-all">Prev</button>
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                <button key={i + 1} onClick={() => loadPage(i + 1)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${page === i + 1 ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-800 hover:text-white"}`}
                                >{i + 1}</button>
                            ))}
                            {totalPages > 5 && <span className="text-slate-600 text-xs self-center">…</span>}
                            <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages || fetching}
                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-slate-400 disabled:opacity-30 hover:bg-slate-700 hover:text-white transition-all">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
