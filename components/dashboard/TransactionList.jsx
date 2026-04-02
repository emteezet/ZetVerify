"use client";

import { useState, useEffect } from "react";
import {
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    ExternalLink,
    ChevronRight,
    RefreshCw,
    Search,
    Copy,
    CheckCircle2,
    XCircle,
    Info,
    Filter
} from "lucide-react";
import Link from "next/link";
import { getTransactionsAction } from "../../actions/wallet";
import { useNotification } from "../NotificationContext";

export default function TransactionList({ userId, refreshTrigger, limit = 10, viewAllHref = null }) {
    const { showNotification } = useNotification();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL"); // ALL, CREDIT, DEBIT
    const [searchQuery, setSearchQuery] = useState("");
    const [copyingId, setCopyingId] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(limit);
    const [hasMore, setHasMore] = useState(true);
 
    const fetchTransactions = async () => {
        setLoading(true);
        const result = await getTransactionsAction(displayLimit + 1);
        if (result.success) {
            if (result.transactions.length > displayLimit) {
                setTransactions(result.transactions.slice(0, displayLimit));
                setHasMore(true);
            } else {
                setTransactions(result.transactions);
                setHasMore(false);
            }
        } else {
            showNotification(result.error, "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        setDisplayLimit(limit);
    }, [limit]);

    useEffect(() => {
        fetchTransactions();
    }, [userId, refreshTrigger, displayLimit]);

    const handleLoadMore = () => {
        setDisplayLimit(prev => prev + 10);
    };

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = 
            tx.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.metadata?.service?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;
        
        if (filter === "ALL") return true;
        if (filter === "CREDIT") return Number(tx.amount) > 0;
        if (filter === "DEBIT") return Number(tx.amount) < 0;
        return true;
    });

    const getTransactionLabel = (tx) => {
        const SERVICE_LABELS = {
            // NIN Services
            'NIN_VERIFY': 'NIN Verification',
            'NIN_PHONE_VERIFY': 'NIN Search (Phone)',
            'NIN_TRACKING_VERIFY': 'NIN Search (Tracking ID)',
            'NIN_DEMO_VERIFY': 'NIN Search (Demography)',
            
            // BVN Services
            'BVN_VERIFY': 'BVN Verification',
            'BVN_PHONE_VERIFY': 'BVN Search (Phone)',
            
            // System
            'FUNDING': 'Wallet Funding',
            'REFUND': 'Service Refund',
            'SERVICE_FEE': 'Identity Verification'
        };

        // 1. Check metadata.service (Most common)
        // 2. Check metadata.service_type
        // 3. Check top-level service_type
        // 4. Check top-level type
        const serviceKey = 
            tx.metadata?.service || 
            tx.metadata?.service_type || 
            tx.service_type || 
            tx.type;

        if (SERVICE_LABELS[serviceKey]) {
            return SERVICE_LABELS[serviceKey];
        }

        // 5. Special Case: Handle "Uniform Service Fee" or "Service Fee" mentions in metadata
        const metadataString = JSON.stringify(tx.metadata || {}).toUpperCase();
        if (metadataString.includes('NIN_PHONE')) return 'NIN Search (Phone)';
        if (metadataString.includes('NIN_TRACK')) return 'NIN Search (Tracking ID)';
        if (metadataString.includes('BVN_PHONE')) return 'BVN Search (Phone)';
        if (metadataString.includes('NIN')) return 'NIN Verification';
        if (metadataString.includes('BVN')) return 'BVN Verification';

        // 6. Generic Format: Replace underscores and capitalize
        return serviceKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopyingId(id);
        setTimeout(() => setCopyingId(null), 2000);
        showNotification("Reference copied to clipboard", "success");
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const d = date.toLocaleDateString('en-NG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const t = date.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `${d} • ${t}`;
    };

    return (
        <div className="glass-card overflow-hidden">
            {/* Header with Search and Filter */}
            <div className="p-6 border-b border-bg-secondary/50 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                            className="p-2 hover:bg-bg-secondary rounded-lg transition-colors border border-bg-secondary"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-4 h-4 text-text-muted ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search by reference or service..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-bg-secondary/30 border border-bg-secondary/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent-green/20 focus:border-accent-green/50 transition-all"
                    />
                </div>
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block overflow-x-auto">
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
                                                ? "bg-primary-50 text-primary-600"
                                                : "bg-blue-50 text-blue-600"
                                                }`}>
                                                {Number(tx.amount) > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <span className="block text-sm font-semibold text-text-primary capitalize">
                                                    {getTransactionLabel(tx)}
                                                </span>
                                                {tx.metadata?.description && (
                                                    <span className="block text-[10px] text-accent-green/70 italic mt-0.5">
                                                        {tx.metadata.description}
                                                    </span>
                                                )}
                                                <span className="block text-[10px] text-text-muted">
                                                    {formatDate(tx.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 group/ref">
                                            <span className="font-mono text-[10px] text-text-muted">
                                                {tx.reference?.slice(0, 15) || "N/A"}
                                            </span>
                                            {tx.reference && (
                                                <button 
                                                    onClick={() => copyToClipboard(tx.reference, tx.id)}
                                                    className="p-1 hover:bg-bg-secondary rounded transition-opacity opacity-0 group-hover:opacity-100"
                                                    title="Copy Reference"
                                                >
                                                    {copyingId === tx.id ? <CheckCircle2 className="w-3 h-3 text-primary-600" /> : <Copy className="w-3 h-3 text-text-muted" />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-bold ${Number(tx.amount) > 0 ? "text-primary-600" : "text-text-primary"
                                            }`}>
                                            {Number(tx.amount) > 0 ? "+" : ""}
                                            ₦{Math.abs(tx.amount).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <span className="badge-valid text-[9px] px-2 py-0.5 flex items-center gap-1">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                Success
                                            </span>
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

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="block md:hidden divide-y divide-bg-secondary/30">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 animate-pulse space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 bg-bg-secondary rounded w-24"></div>
                                <div className="h-4 bg-bg-secondary rounded w-16"></div>
                            </div>
                            <div className="h-3 bg-bg-secondary rounded w-32"></div>
                        </div>
                    ))
                ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                        <div key={tx.id} className="p-4 space-y-3 hover:bg-bg-secondary/10 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${Number(tx.amount) > 0
                                        ? "bg-primary-50 text-primary-600"
                                        : "bg-blue-50 text-blue-600"
                                        }`}>
                                        {Number(tx.amount) > 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-text-primary capitalize">
                                            {getTransactionLabel(tx)}
                                        </span>
                                        {tx.metadata?.description && (
                                            <span className="block text-[8px] text-accent-green/70 italic mt-0.5">
                                                {tx.metadata.description}
                                            </span>
                                        )}
                                        <span className="block text-[10px] text-text-muted">
                                            {formatDate(tx.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <span className={`text-sm font-black ${Number(tx.amount) > 0 ? "text-primary-600" : "text-text-primary"}`}>
                                    {Number(tx.amount) > 0 ? "+" : ""}
                                    ₦{Math.abs(tx.amount).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center bg-bg-secondary/30 p-2 rounded-lg">
                                <span className="font-mono text-[9px] text-text-muted truncate max-w-[150px]">
                                    {tx.reference || "N/A"}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => copyToClipboard(tx.reference, tx.id)}
                                        className="p-1"
                                    >
                                        {copyingId === tx.id ? <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" /> : <Copy className="w-3.5 h-3.5 text-text-muted opacity-50" />}
                                    </button>
                                    <span className="badge-valid text-[8px] px-1.5 py-0.5">Success</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                            <Search className="w-8 h-8" />
                            <p className="text-sm font-medium">No transactions found</p>
                        </div>
                    </div>
                )}
            </div>

            {viewAllHref && transactions.length > 0 ? (
                <div className="p-4 border-t border-bg-secondary/50 flex justify-center">
                    <Link 
                        href={viewAllHref}
                        className="text-[10px] font-black uppercase tracking-widest text-accent-green hover:underline flex items-center gap-2 group"
                    >
                        View Full Audit Log
                        <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            ) : (
                !viewAllHref && hasMore && transactions.length > 0 && (
                    <div className="p-4 border-t border-bg-secondary/50 flex justify-center">
                        <button 
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="text-[10px] font-black uppercase tracking-widest text-accent-green hover:underline flex items-center gap-2 group disabled:opacity-50"
                        >
                            {loading ? "Loading..." : "Show More Transactions"}
                            {!loading && <ChevronRight className="w-3 h-3 rotate-90 transition-transform group-hover:translate-y-1" />}
                        </button>
                    </div>
                )
            )}
        </div>
    );
}
