"use client";

import { useAuth } from "./AuthContext";
import { WifiOff, AlertTriangle } from "lucide-react";

export default function OfflineBanner() {
    const { isOnline } = useAuth();

    if (isOnline) return null;

    return (
        <div className="bg-[#f59e0b] text-white px-4 py-3 flex items-center justify-center gap-3 sticky top-0 z-[10000] animate-in slide-in-from-top duration-300 shadow-md">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-bold tracking-tight">
                You are currently offline. Please check your internet connection.
            </p>
            <AlertTriangle className="w-4 h-4 opacity-75 hidden sm:block" />
        </div>
    );
}
