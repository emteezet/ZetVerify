"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import {
    Users,
    Search,
    ShieldAlert,
    ChevronLeft,
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    History
} from "lucide-react";
import { getAllUsersAction, updateUserWalletAction } from "@/actions/admin";
import { useNotification } from "@/components/NotificationContext";

export default function AdminUsersPage() {
    const { showNotification } = useNotification();
    const router = useRouter();
    const { loading: authLoading, isAuthenticated } = useAuth();
    const [users, setUsers] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Wallet Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [adjustAmount, setAdjustAmount] = useState("");
    const [adjustType, setAdjustType] = useState("FUNDING");
    const [adjustReason, setAdjustReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchUsers = async () => {
        setFetching(true);
        const result = await getAllUsersAction();
        if (result.success) {
            setUsers(result.users);
        } else {
            showNotification(result.error, "error");
        }
        setFetching(false);
    };

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login");
        } else if (!authLoading && isAuthenticated) {
            fetchUsers();
        }
    }, [authLoading, isAuthenticated]);

    const handleUpdateWallet = async (e) => {
        e.preventDefault();
        if (!adjustAmount || isNaN(adjustAmount)) return;

        setIsSubmitting(true);
        const amount = adjustType === "DEBIT" ? -Math.abs(adjustAmount) : Math.abs(adjustAmount);
        
        const result = await updateUserWalletAction(
            selectedUser.id, 
            amount, 
            adjustType === "DEBIT" ? "SERVICE_FEE" : "FUNDING", 
            adjustReason || `Admin Adjustment: ${adjustType}`
        );

        if (result.success) {
            showNotification(`Wallet updated successfully! New balance: ₦${result.newBalance}`, "success");
            setSelectedUser(null);
            setAdjustAmount("");
            setAdjustReason("");
            fetchUsers(); // Refresh list
        } else {
            showNotification(result.error, "error");
        }
        setIsSubmitting(false);
    };

    const filteredUsers = users.filter(u => 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (authLoading || (fetching && users.length === 0)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                 <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-secondary/30 pb-20 pt-24 px-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <button 
                    onClick={() => router.push("/admin")}
                    className="flex items-center gap-2 text-text-muted hover:text-text-primary mb-6 transition-colors font-semibold text-sm"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back to Overview
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary tracking-tight">User Management</h1>
                        <p className="text-text-muted mt-1">Monitor all registered accounts and balance histories.</p>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-12 h-12 bg-white border-transparent shadow-sm"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="glass-card overflow-hidden bg-white shadow-xl shadow-slate-200/50">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-bg-secondary/50 text-text-muted text-[10px] uppercase tracking-wider font-bold">
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Wallet Balance</th>
                                    <th className="px-6 py-4">Joined At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-bg-secondary/30">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-bg-secondary/10 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-text-primary uppercase">
                                                    {u.first_name?.[0] || u.email[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-text-primary">
                                                        {u.first_name ? `${u.first_name} ${u.last_name}` : "Pending Setup"}
                                                    </span>
                                                    <span className="text-xs text-text-muted">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-text-primary">
                                                    ₦{u.wallet_balance?.toLocaleString() || "0"}
                                                </span>
                                                <span className="text-[10px] text-text-muted">Ledger Balance</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-text-muted">
                                            {u.updated_at ? new Date(u.updated_at).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => setSelectedUser(u)}
                                                    className="p-2 hover:bg-primary-50 text-primary-500 rounded-lg transition-colors"
                                                    title="Manage Wallet"
                                                >
                                                    <Wallet className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    className="p-2 hover:bg-bg-secondary text-text-muted rounded-lg transition-colors"
                                                    title="View History"
                                                >
                                                    <History className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Wallet Adjustment Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary-50 text-primary-500 rounded-2xl">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">Adjust Wallet</h2>
                                <p className="text-sm text-text-muted">{selectedUser.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateWallet} className="space-y-6">
                            <div className="grid grid-cols-2 gap-3 p-1 bg-bg-secondary rounded-xl">
                                {["FUNDING", "DEBIT"].map(type => (
                                    <button 
                                        key={type}
                                        type="button"
                                        onClick={() => setAdjustType(type)}
                                        className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            adjustType === type ? 'bg-white shadow-sm text-primary-500' : 'text-text-muted'
                                        }`}
                                    >
                                        {type === "FUNDING" ? "Add Funds" : "Debit Funds"}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Amount (₦)</label>
                                <input 
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    placeholder="Enter amount..."
                                    className="input-field h-14"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Adjustment Reason</label>
                                <textarea 
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Why are you adjusting this?"
                                    className="input-field min-h-[100px] py-4"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-4 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !adjustAmount}
                                    className="flex-3 btn-primary py-4 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                                    Confirm Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
