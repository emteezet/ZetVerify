"use client";

import { useState, useEffect } from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    ExternalLink,
    ChevronRight,
    RefreshCw,
    Search
} from "lucide-react";
import { getTransactionsAction } from "../../actions/wallet";
import { useNotification } from "../NotificationContext";

export default function TransactionList({ userId, refreshTrigger }) {
    const { showNotification } = useNotification();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, CREDIT, DEBIT

    const fetchTransactions = async () => {
        setLoading(true);
        const result = await getTransactionsAction(userId);
        if (result.success) {
            setTransactions(result.transactions);
        } else {
            showNotification(result.error, "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTransactions();
    }, [userId, refreshTrigger]);

    const filteredTransactions = transactions.filter(tx => {
        if (filter === "ALL") return true;
        if (filter === "CREDIT") return Number(tx.amount) > 0;
        if (filter === "DEBIT") return Number(tx.amount) < 0;
        return true;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-bg-secondary/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-text-primary flex items-center gap-2">
                        <Clock className="w-5 h-5 text-accent-green" />
                        Transaction History
                    </h3>
                    <p className="text-xs text-text-muted mt-1">Audit log of your wallet activity</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-bg-secondary/50 p-1 rounded-lg">
                        {["ALL", "CREDIT", "DEBIT"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${filter === f
                                    ? "bg-white text-accent-green shadow-sm"
                                    : "text-text-muted hover:text-text-primary"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchTransactions}
                        className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 text-text-muted ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-bg-secondary/30 text-text-muted text-[10px] uppercase tracking-wider">
                            <th className="px-6 py-3 font-bold">Details</th>
                            <th className="px-6 py-3 font-bold">Reference</th>
                            <th className="px-6 py-3 font-bold text-right">Amount</th>
                            <th className="px-6 py-3 font-bold text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-bg-secondary/30">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-4 bg-bg-secondary rounded w-32 mb-1"></div><div className="h-3 bg-bg-secondary rounded w-20"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-bg-secondary rounded w-24"></div></td>
                                    <td className="px-6 py-4 text-right"><div className="h-4 bg-bg-secondary rounded w-16 ml-auto"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 bg-bg-secondary rounded w-12 mx-auto"></div></td>
                                </tr>
                            ))
                        ) : filteredTransactions.length > 0 ? (
                            filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-bg-secondary/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${Number(tx.amount) > 0
                                                ? "bg-green-50 text-green-600"
                                                : "bg-blue-50 text-blue-600"
                                                }`}>
                                                {Number(tx.amount) > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-semibold text-text-primary">
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                                <span className="block text-[10px] text-text-muted">
                                                    {formatDate(tx.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
                                            {tx.reference?.slice(0, 12) || "N/A"}
                                            {tx.reference && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-bold ${Number(tx.amount) > 0 ? "text-green-600" : "text-text-primary"
                                            }`}>
                                            {Number(tx.amount) > 0 ? "+" : ""}
                                            ₦{Math.abs(tx.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className="badge-valid text-[9px] px-2 py-0.5">Success</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                        <Search className="w-8 h-8" />
                                        <p className="text-sm font-medium">No transactions found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {transactions.length > 0 && (
                <div className="p-4 border-t border-bg-secondary/50 flex justify-center">
                    <button className="text-[10px] font-bold text-accent-green hover:underline flex items-center gap-1">
                        View Full Audit Log
                        <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
