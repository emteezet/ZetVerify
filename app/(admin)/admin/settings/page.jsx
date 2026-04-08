"use client";

import { useAuth } from "@/components/AuthContext";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { Shield, Settings, DollarSign, Lock } from "lucide-react";

export default function AdminSettingsPage() {
    const { user } = useAuth();

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            <AdminTopBar />

            <div className="flex-1 p-6 space-y-6 max-w-3xl w-full mx-auto">
                <div>
                    <h1 className="text-lg font-black text-white">Settings</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Platform configuration and administrator information.</p>
                </div>

                {/* Admin Info */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-900/40 text-indigo-400 flex items-center justify-center">
                            <Shield size={16} />
                        </div>
                        <h2 className="text-sm font-bold text-white">Administrator Account</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Name", value: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—" },
                            { label: "Email", value: user?.email || "—" },
                            { label: "Role", value: "Super Administrator" },
                            { label: "Access Level", value: "Full Platform Control" },
                        ].map(f => (
                            <div key={f.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{f.label}</p>
                                <p className="text-sm font-semibold text-white">{f.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Platform config */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-900/30 text-amber-400 flex items-center justify-center">
                            <DollarSign size={16} />
                        </div>
                        <h2 className="text-sm font-bold text-white">Platform Fees</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "NIN Verification Fee", value: "₦150" },
                            { label: "BVN Verification Fee", value: "₦150" },
                            { label: "NIN Phone Lookup Fee", value: "₦150" },
                            { label: "BVN Phone Lookup Fee", value: "₦150" },
                        ].map(f => (
                            <div key={f.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
                                <p className="text-xs text-slate-400">{f.label}</p>
                                <p className="text-sm font-black text-amber-400">{f.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-start gap-3 p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl mt-2">
                        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-400/80 leading-relaxed">
                            Fee changes require a code update and re-deploy. Contact your developer to modify platform pricing.
                        </p>
                    </div>
                </div>

                {/* App version */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                            <Settings size={16} />
                        </div>
                        <h2 className="text-sm font-bold text-white">Platform Info</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Platform", value: "ZetVerify" },
                            { label: "Stack", value: "Next.js + Supabase" },
                            { label: "Data Provider", value: "NIMC / NIBSS Aggregator" },
                            { label: "Transaction Ledger", value: "ACID-Compliant" },
                        ].map(f => (
                            <div key={f.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{f.label}</p>
                                <p className="text-sm font-semibold text-white">{f.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
