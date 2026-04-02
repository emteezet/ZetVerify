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
    History,
    ChevronRight,
    Trash2
} from "lucide-react";
import { 
    getAllUsersAction, 
    updateUserWalletAction, 
    updateUserStatusAction, 
    getUserActivityAction,
    getUserTransactionsAction,
    deleteUserAction 
} from "@/actions/admin";
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

    // Status Modal State
    const [statusModalUser, setStatusModalUser] = useState(null);
    const [newStatus, setNewStatus] = useState("ACTIVE");
    const [statusReason, setStatusReason] = useState("");
    // Delete Modal State
    const [deleteModalUser, setDeleteModalUser] = useState(null);

    // Activity Modal State
    const [activityUser, setActivityUser] = useState(null);
    const [activityData, setActivityData] = useState(null);
    const [loadingActivity, setLoadingActivity] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState("TRANSACTIONS");

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

    const handleLoadMore = async () => {
        if (!activityData || loadingMore) return;
        
        setLoadingMore(true);
        const offset = activityData.transactions.length;
        const res = await getUserTransactionsAction(activityUser.id, 10, offset);
        
        if (res.success) {
            setActivityData(prev => ({
                ...prev,
                transactions: [...prev.transactions, ...res.data.transactions],
                hasMoreTransactions: res.data.hasMore
            }));
        }
        setLoadingMore(false);
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await updateUserStatusAction(statusModalUser.id, newStatus, statusReason);
        if (result.success) {
            showNotification(`User status updated to ${newStatus}`, "success");
            setStatusModalUser(null);
            setStatusReason("");
            fetchUsers();
        } else {
            showNotification(result.error, "error");
        }
        setIsSubmitting(false);
    };

    const handleDeleteUser = async () => {
        if (!deleteModalUser) return;
        setIsSubmitting(true);
        const result = await deleteUserAction(deleteModalUser.id);
        if (result.success) {
            showNotification(`User ${deleteModalUser.email} has been permanently deleted`, "success");
            setDeleteModalUser(null);
            fetchUsers();
        } else {
            showNotification(result.error, "error");
        }
        setIsSubmitting(false);
    };

    const handleViewActivity = async (user) => {
        setActivityUser(user);
        setLoadingActivity(true);
        setActiveTab("TRANSACTIONS");
        const result = await getUserActivityAction(user.id);
        if (result.success) {
            setActivityData(result.data);
        } else {
            showNotification(result.error, "error");
            setActivityUser(null);
        }
        setLoadingActivity(false);
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
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                                                u.status === 'SUSPENDED' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                {u.status === 'SUSPENDED' ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                                                 <CheckCircle2 className="w-3.5 h-3.5" />} 
                                                {u.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-text-primary">
                                                    ₦{u.wallet_balance?.toLocaleString() || "0"}
                                                </span>
                                                <span className="text-[10px] text-text-muted">Wallet Balance</span>
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
                                                    onClick={() => handleViewActivity(u)}
                                                    className="p-2 hover:bg-bg-secondary text-text-muted rounded-lg transition-colors"
                                                    title="View Activity"
                                                >
                                                    <History className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setStatusModalUser(u);
                                                        setNewStatus(u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        u.status === 'ACTIVE' ? 'hover:bg-amber-50 text-amber-500' : 'hover:bg-emerald-50 text-emerald-500'
                                                    }`}
                                                    title={u.status === 'ACTIVE' ? "Suspend User" : "Activate User"}
                                                >
                                                    {u.status === 'ACTIVE' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteModalUser(u)}
                                                    className="p-2 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors group"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
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

            {/* Status Update Modal */}
            {statusModalUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300 text-center">
                        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                            newStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                            {newStatus === 'ACTIVE' ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                        </div>
                        
                        <h2 className="text-xl font-black text-text-primary mb-2">
                            {newStatus === 'ACTIVE' ? 'Activate User?' : 'Suspend/Block User?'}
                        </h2>
                        <p className="text-sm text-text-muted mb-8">
                            {newStatus === 'ACTIVE' 
                                ? `Are you sure you want to restore access for ${statusModalUser.email}?` 
                                : `Prevent ${statusModalUser.email} from accessing verification services.`}
                        </p>

                        <form onSubmit={handleUpdateStatus} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Select Action</label>
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="input-field h-12"
                                >
                                    <option value="ACTIVE">ACTIVATE ACCOUNT</option>
                                    <option value="SUSPENDED">SUSPEND ACCOUNT</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Reason (Optional)</label>
                                <textarea 
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    placeholder="Brief explanation for records..."
                                    className="input-field min-h-[80px] py-4"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setStatusModalUser(null)}
                                    className="flex-1 py-4 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-2 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-95 ${
                                        newStatus === 'ACTIVE' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'
                                    }`}
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {activityUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] p-10 shadow-2xl animate-in zoom-in duration-300 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-slate-100 rounded-2xl">
                                    <History className="w-6 h-6 text-text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-text-primary tracking-tight">User Activity Details</h2>
                                    <p className="text-sm text-text-muted">Monitoring logs for {activityUser.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActivityUser(null)}
                                className="p-3 hover:bg-bg-secondary rounded-2xl text-text-muted transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 rotate-180" />
                            </button>
                        </div>

                        {loadingActivity ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                                <p className="text-text-muted animate-pulse font-medium">Fetching activity data...</p>
                            </div>
                        ) : activityData ? (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-10 custom-scrollbar">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-6 rounded-3xl bg-primary-50/50 border border-primary-100">
                                        <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1">Total Spent</p>
                                        <p className="text-3xl font-black text-primary-900">₦{activityData.stats.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Verification Volume</p>
                                        <p className="text-3xl font-black text-slate-900">{activityData.stats.totalVerifications} Records</p>
                                    </div>
                                </div>

                                {/* Tabs Switcher */}
                                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
                                    <button 
                                        onClick={() => setActiveTab("TRANSACTIONS")}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            activeTab === "TRANSACTIONS" ? 'bg-white text-primary-600 shadow-sm' : 'text-text-muted hover:text-text-primary'
                                        }`}
                                    >
                                        Transaction History
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab("VERIFICATIONS")}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            activeTab === "VERIFICATIONS" ? 'bg-white text-primary-600 shadow-sm' : 'text-text-muted hover:text-text-primary'
                                        }`}
                                    >
                                        Identity History
                                    </button>
                                </div>

                                {/* Tab Content */}
                                {activeTab === "TRANSACTIONS" ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <Wallet className="w-4 h-4 text-primary-500" />
                                            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Recent Transactions</h3>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50/80 text-text-muted font-bold uppercase tracking-tighter">
                                                        <th className="px-6 py-4">Type</th>
                                                        <th className="px-6 py-4">Amount</th>
                                                        <th className="px-6 py-4">Reference</th>
                                                        <th className="px-6 py-4">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {activityData.transactions.length > 0 ? activityData.transactions.map(tx => (
                                                        <tr key={tx.id} className="hover:bg-slate-50/30">
                                                            <td className="px-6 py-5">
                                                                <div className="font-bold capitalize">
                                                                    {(tx.metadata?.service || tx.type).replace(/_/g, ' ').toLowerCase()}
                                                                    {tx.metadata?.identifier && ` (${tx.metadata.identifier})`}
                                                                </div>
                                                                {tx.metadata?.description && (
                                                                    <div className="text-[10px] text-text-muted mt-1 italic">{tx.metadata.description}</div>
                                                                )}
                                                            </td>
                                                            <td className={`px-6 py-5 font-black ${Number(tx.amount) >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                                {Number(tx.amount) >= 0 ? '+' : '-'}₦{Math.abs(Number(tx.amount)).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-5 text-text-muted font-mono">{tx.reference?.slice(0, 15)}...</td>
                                                            <td className="px-6 py-5 text-text-muted whitespace-nowrap">
                                                                {new Date(tx.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-20 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-text-muted">
                                                                    <Wallet className="w-10 h-10 opacity-20" />
                                                                    <p className="italic">No transactions found</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Load More Button */}
                                        {activityData.hasMoreTransactions && (
                                            <div className="flex justify-center pt-2">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-primary-600 hover:border-primary-200 hover:bg-primary-50/30 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                                                >
                                                    {loadingMore ? (
                                                        <>
                                                            <span className="w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
                                                            Loading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronRight className="w-3 h-3 rotate-90" />
                                                            Load More History
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-2 mb-2 px-1">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Verification Log</h3>
                                        </div>
                                        <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50/80 text-text-muted font-bold uppercase tracking-tighter">
                                                        <th className="px-6 py-4">Identity Number</th>
                                                        <th className="px-6 py-4">Service</th>
                                                        <th className="px-6 py-4">Slip Type</th>
                                                        <th className="px-6 py-4">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {activityData.verifications.length > 0 ? activityData.verifications.map(v => (
                                                        <tr key={v.id} className="hover:bg-slate-50/30">
                                                            <td className="px-6 py-5">
                                                                <div className="font-black text-primary-600 text-sm">{v.decrypted_identifier || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <div className="font-bold text-text-primary capitalize">{v.type?.replace('_VERIFY', '').replace('_', ' ').toLowerCase()}</div>
                                                            </td>
                                                            <td className="px-6 py-5 uppercase text-[10px] font-black">{v.slip_type || 'STANDARD'}</td>
                                                            <td className="px-6 py-5 text-text-muted">
                                                                {new Date(v.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-20 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-text-muted">
                                                                    <CheckCircle2 className="w-10 h-10 opacity-20" />
                                                                    <p className="italic">No verification records found</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {deleteModalUser && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300 text-center border-t-8 border-rose-500">
                        <div className="mx-auto w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-8 rotate-3 shadow-lg shadow-rose-100">
                            <Trash2 className="w-10 h-10" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                            Permanent Deletion?
                        </h2>
                        <p className="text-sm text-slate-500 mb-10 leading-relaxed px-4">
                            You are about to permanently delete <span className="font-bold text-slate-900 underline decoration-rose-200 decoration-4">{deleteModalUser.email}</span>. This action is irreversible and removes all account history.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDeleteUser}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 group-hover:animate-bounce" />}
                                DELETE PERMANENTLY
                            </button>
                            <button 
                                type="button"
                                onClick={() => setDeleteModalUser(null)}
                                className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
                            >
                                I changed my mind
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
