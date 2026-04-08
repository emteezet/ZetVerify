"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import AdminTopBar from "@/components/admin/AdminTopBar";
import {
    Users,
    Search,
    ShieldAlert,
    Wallet,
    Loader2,
    CheckCircle2,
    History,
    Trash2,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronRight,
    ChevronLeft
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
            <div className="flex flex-col h-screen bg-slate-950">
                <AdminTopBar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            <AdminTopBar onRefresh={fetchUsers} isRefreshing={fetching} />

            <div className="flex-1 p-6 space-y-6 max-w-[1400px] w-full mx-auto">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div>
                        <h1 className="text-lg font-black text-white">User Management</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Monitor all registered accounts and balance histories.</p>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-600 transition-colors"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-800/60 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-700/50">
                                    <th className="px-6 py-4">User Details</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Wallet Balance</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Joined At</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                            <p className="text-slate-500 text-sm">No users found.</p>
                                        </td>
                                    </tr>
                                ) : filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 uppercase">
                                                    {u.first_name?.[0] || u.email[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200">
                                                        {u.first_name ? `${u.first_name} ${u.last_name}` : "Pending Setup"}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{u.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                                                u.status === 'SUSPENDED' ? 'bg-amber-900/40 text-amber-500 border border-amber-800' : 
                                                'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50'
                                            }`}>
                                                {u.status === 'SUSPENDED' ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                                                 <CheckCircle2 className="w-3.5 h-3.5" />} 
                                                {u.status || 'ACTIVE'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-200">
                                                    ₦{u.wallet_balance?.toLocaleString() || "0"}
                                                </span>
                                                <span className="text-[10px] text-slate-500">Wallet Balance</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-xs text-slate-500 hidden md:table-cell">
                                            {u.updated_at ? new Date(u.updated_at).toLocaleDateString() : "N/A"}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => setSelectedUser(u)}
                                                    className="p-2 hover:bg-slate-800 text-indigo-400 rounded-lg transition-colors"
                                                    title="Manage Wallet"
                                                >
                                                    <Wallet className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleViewActivity(u)}
                                                    className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                                                    title="View Activity"
                                                >
                                                    <History className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setStatusModalUser(u);
                                                        setNewStatus(u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors hover:bg-slate-800 ${
                                                        u.status === 'ACTIVE' ? 'text-amber-500' : 'text-emerald-500'
                                                    }`}
                                                    title={u.status === 'ACTIVE' ? "Suspend User" : "Activate User"}
                                                >
                                                    {u.status === 'ACTIVE' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                                </button>
                                                <button 
                                                    onClick={() => setDeleteModalUser(u)}
                                                    className="p-2 hover:bg-rose-900/40 text-rose-500 rounded-lg transition-colors group"
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-900/40 text-indigo-400 border border-indigo-500/30 rounded-2xl">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Adjust Wallet</h2>
                                <p className="text-sm text-slate-400">{selectedUser.email}</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateWallet} className="space-y-6">
                            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
                                {["FUNDING", "DEBIT"].map(type => (
                                    <button 
                                        key={type}
                                        type="button"
                                        onClick={() => setAdjustType(type)}
                                        className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            adjustType === type ? 'bg-slate-800 shadow-xl border border-slate-700 text-indigo-400' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        {type === "FUNDING" ? "Add Funds" : "Debit Funds"}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount (₦)</label>
                                <input 
                                    type="number"
                                    value={adjustAmount}
                                    onChange={(e) => setAdjustAmount(e.target.value)}
                                    placeholder="Enter amount..."
                                    className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adjustment Reason</label>
                                <textarea 
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Why are you adjusting this?"
                                    className="w-full min-h-[100px] py-4 px-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700 resize-none"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setSelectedUser(null)}
                                    className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting || !adjustAmount}
                                    className="flex-1 py-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {statusModalUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300 text-center">
                        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${
                            newStatus === 'ACTIVE' ? 'bg-emerald-900/30 text-emerald-500 border-emerald-500/30' : 'bg-amber-900/30 text-amber-500 border-amber-500/30'
                        }`}>
                            {newStatus === 'ACTIVE' ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                        </div>
                        
                        <h2 className="text-xl font-black text-white mb-2">
                            {newStatus === 'ACTIVE' ? 'Activate User?' : 'Suspend/Block User?'}
                        </h2>
                        <p className="text-sm text-slate-400 mb-8">
                            {newStatus === 'ACTIVE' 
                                ? `Are you sure you want to restore access for ${statusModalUser.email}?` 
                                : `Prevent ${statusModalUser.email} from accessing verification services.`}
                        </p>

                        <form onSubmit={handleUpdateStatus} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Action</label>
                                <select 
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full h-12 px-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                >
                                    <option value="ACTIVE">ACTIVATE ACCOUNT</option>
                                    <option value="SUSPENDED">SUSPEND ACCOUNT</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason (Optional)</label>
                                <textarea 
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    placeholder="Brief explanation for records..."
                                    className="w-full min-h-[80px] p-4 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-700"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setStatusModalUser(null)}
                                    className="flex-1 py-4 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                                        newStatus === 'ACTIVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
                                    }`}
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Activity Modal */}
            {activityUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] p-8 md:p-10 shadow-3xl animate-in zoom-in duration-300 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                                    <History className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">User Activity</h2>
                                    <p className="text-xs md:text-sm text-slate-400 truncate">{activityUser.email}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setActivityUser(null)}
                                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 rotate-180" />
                            </button>
                        </div>

                        {loadingActivity ? (
                            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                                <p className="text-slate-400 animate-pulse font-medium text-sm">Fetching activity data...</p>
                            </div>
                        ) : activityData ? (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-indigo-900/20 border border-indigo-500/20">
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Total Spent</p>
                                        <p className="text-2xl font-black text-white">₦{activityData.stats.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-slate-800 border border-slate-700">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Verification Volume</p>
                                        <p className="text-2xl font-black text-white">{activityData.stats.totalVerifications} Records</p>
                                    </div>
                                </div>

                                {/* Tabs Switcher */}
                                <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl w-fit border border-slate-800">
                                    <button 
                                        onClick={() => setActiveTab("TRANSACTIONS")}
                                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            activeTab === "TRANSACTIONS" ? 'bg-slate-800 text-indigo-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        Wallet LEDGER
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab("VERIFICATIONS")}
                                        className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                            activeTab === "VERIFICATIONS" ? 'bg-slate-800 text-indigo-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                    >
                                        Identity Logs
                                    </button>
                                </div>

                                {/* Tab Content */}
                                {activeTab === "TRANSACTIONS" ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-800">
                                                        <th className="px-5 py-3">Details</th>
                                                        <th className="px-5 py-3">Amount</th>
                                                        <th className="px-5 py-3 hidden md:table-cell">Reference</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/60">
                                                    {activityData.transactions.length > 0 ? activityData.transactions.map(tx => (
                                                        <tr key={tx.id} className="hover:bg-slate-900/50">
                                                            <td className="px-5 py-4">
                                                                <div className="font-bold text-slate-200 capitalize">
                                                                    {(tx.metadata?.service || tx.type).replace(/_/g, ' ').toLowerCase()}
                                                                    {tx.metadata?.identifier && ` (${tx.metadata.identifier})`}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 mt-1">{new Date(tx.created_at).toLocaleDateString()}</div>
                                                            </td>
                                                            <td className={`px-5 py-4 font-black ${Number(tx.amount) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                {Number(tx.amount) >= 0 ? '+' : '-'}₦{Math.abs(Number(tx.amount)).toLocaleString()}
                                                            </td>
                                                            <td className="px-5 py-4 text-slate-600 font-mono hidden md:table-cell">{tx.reference?.slice(0, 15)}...</td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="3" className="px-5 py-12 text-center text-slate-500 italic">
                                                                No transactions found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {activityData.hasMoreTransactions && (
                                            <div className="flex justify-center pt-2 pb-6">
                                                <button
                                                    onClick={handleLoadMore}
                                                    disabled={loadingMore}
                                                    className="px-6 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {loadingMore ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Load More"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-slate-900 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-800">
                                                        <th className="px-5 py-3">Identity Number</th>
                                                        <th className="px-5 py-3">Service</th>
                                                        <th className="px-5 py-3">Slip Type</th>
                                                        <th className="px-5 py-3 hidden md:table-cell">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/60">
                                                    {activityData.verifications.length > 0 ? activityData.verifications.map(v => (
                                                        <tr key={v.id} className="hover:bg-slate-900/50">
                                                            <td className="px-5 py-4">
                                                                <div className="font-mono text-indigo-400 font-black">{v.decrypted_identifier || 'N/A'}</div>
                                                            </td>
                                                            <td className="px-5 py-4 text-slate-200 capitalize font-medium">
                                                                {v.type?.replace('_VERIFY', '').replace('_', ' ').toLowerCase()}
                                                            </td>
                                                            <td className="px-5 py-4 uppercase text-[10px] font-bold text-slate-400 bg-slate-900 rounded px-2 w-fit inline-block mt-2">{v.slip_type || 'STANDARD'}</td>
                                                            <td className="px-5 py-4 text-slate-500 hidden md:table-cell">
                                                                {new Date(v.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    )) : (
                                                        <tr>
                                                            <td colSpan="4" className="px-5 py-12 text-center text-slate-500 italic">
                                                                No verification records found
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
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300 text-center border-t-4 border-t-rose-500">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-900/30 text-rose-500 flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        
                        <h2 className="text-xl font-black text-white mb-3">
                            Delete Account?
                        </h2>
                        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                            You are about to permanently delete <span className="font-bold text-white bg-slate-800 px-1 py-0.5 rounded">{deleteModalUser.email}</span>. This action is irreversible.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDeleteUser}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Permanently Delete"}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setDeleteModalUser(null)}
                                className="w-full py-3.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
