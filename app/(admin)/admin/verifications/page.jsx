"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { getAllVerificationsAction } from "@/actions/admin";
import { useNotification } from "@/components/NotificationContext";
import { ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

const TYPE_LABEL = (type) => {
    if (!type) return "Unknown";
    return type.replace(/_VERIFY$/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export default function AdminVerificationsPage() {
    const { showNotification } = useNotification();
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    const [verifications, setVerifications] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [fetching, setFetching] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!loading && !isAuthenticated) router.push("/auth/login");
    }, [loading, isAuthenticated]);

    const load = async (p) => {
        setFetching(true);
        const res = await getAllVerificationsAction(p, PAGE_SIZE);
        if (res.success) {
            setVerifications(res.verifications);
            setTotal(res.total);
            setPage(p);
        } else {
            showNotification(res.error, "error");
        }
        setFetching(false);
    };

    useEffect(() => {
        if (!loading && isAuthenticated) load(1);
    }, [loading, isAuthenticated]);

    const filtered = verifications.filter(v => {
        const q = search.toLowerCase();
        if (!q) return true;
        return (
            v.decrypted_identifier?.toLowerCase().includes(q) ||
            v.user?.email?.toLowerCase().includes(q) ||
            `${v.user?.first_name || ""} ${v.user?.last_name || ""}`.toLowerCase().includes(q)
        );
    });

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            <AdminTopBar onRefresh={() => load(page)} isRefreshing={fetching} />

            <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black text-white">Identity Logs</h1>
                        <p className="text-slate-500 text-sm mt-0.5">All verification_history records across every user.</p>
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search identity or email..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 transition-colors"
                        />
                    </div>
                </div>

                <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-opacity ${fetching ? "opacity-60" : ""}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
                                    <th className="px-6 py-3">Identity Number</th>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Service</th>
                                    <th className="px-6 py-3">Slip Type</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <ShieldCheck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">No identity logs found.</p>
                                        </td>
                                    </tr>
                                ) : filtered.map(v => (
                                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-black text-indigo-400 font-mono text-sm">{v.decrypted_identifier || "—"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-slate-200">
                                                {v.user?.first_name ? `${v.user.first_name} ${v.user.last_name}` : "Unknown"}
                                            </p>
                                            <p className="text-[10px] text-slate-500">{v.user?.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-300">{TYPE_LABEL(v.type)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                                {v.slip_type || "STANDARD"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500">
                                            {new Date(v.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                        <p className="text-[10px] text-slate-500">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}</p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => load(page - 1)} disabled={page === 1 || fetching}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                <button key={i + 1} onClick={() => load(i + 1)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${page === i + 1 ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-800 hover:text-white"}`}
                                >{i + 1}</button>
                            ))}
                            <button onClick={() => load(page + 1)} disabled={page >= totalPages || fetching}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
