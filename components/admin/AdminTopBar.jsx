"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useEffect, useState } from "react";
import { RefreshCw, Shield } from "lucide-react";

const PAGE_TITLES = {
    "/admin": "Platform Overview",
    "/admin/users": "User Management",
    "/admin/transactions": "Global Transactions",
    "/admin/analytics": "Analytics",
    "/admin/verifications": "Identity Logs",
    "/admin/settings": "Settings",
};

export default function AdminTopBar({ onRefresh, isRefreshing }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const [time, setTime] = useState("");

    useEffect(() => {
        const update = () => {
            setTime(new Date().toLocaleTimeString("en-NG", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            }));
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    const title = PAGE_TITLES[pathname] || "Admin";

    return (
        <header className="h-14 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 shrink-0">
            {/* Left: page title */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                </div>
                <span className="text-slate-600 text-xs">/</span>
                <h1 className="text-sm font-bold text-white">{title}</h1>
            </div>

            {/* Right: clock + badge + refresh */}
            <div className="flex items-center gap-4">
                {/* Live clock */}
                <span className="hidden sm:block font-mono text-xs text-slate-500 tabular-nums">{time}</span>

                {/* Admin badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="w-5 h-5 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-[10px] uppercase">
                        {user?.firstName?.[0] || "A"}
                    </div>
                    <span className="text-xs font-semibold text-slate-300">{user?.firstName || "Admin"}</span>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-900/40 px-1.5 py-0.5 rounded">SU</span>
                </div>

                {/* Refresh */}
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        title="Refresh data"
                        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-indigo-400" : ""}`} />
                    </button>
                )}
            </div>
        </header>
    );
}
