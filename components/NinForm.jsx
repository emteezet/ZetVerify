"use client";

import React, { useState } from "react";
import { Search, Loader2, Smartphone, Hash } from "lucide-react";
import { useAuth } from "./AuthContext";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function NinForm({ onSubmit, loading, placeholder = "Enter NIN or Phone Number" }) {
    const { isOnline } = useAuth();
    const [query, setQuery] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const val = e.target.value.replace(/[^\d]/g, ""); // Allow only digits
        if (val.length <= 11) {
            setQuery(val);
            setError("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = query.trim();

        if (!trimmed) {
            setError("Please enter a NIN or phone number.");
            return;
        }

        // Validate: must be exactly 11 digits
        // NIN is 11 digits, Phone is 11 digits starting with 0
        if (trimmed.length !== 11) {
            setError("Please enter exactly 11 numeric digits.");
            return;
        }

        if (trimmed.startsWith('0')) {
             // Likely a phone number
        } else {
             // Likely a NIN
        }

        onSubmit(trimmed);
    };

    const isInputValid = query.length === 11;

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {query.startsWith('0') ? (
                        <Smartphone className="h-5 w-5 text-slate-400 Transition-all duration-300" />
                    ) : (
                        <Hash className="h-5 w-5 text-slate-400 transition-all duration-300" />
                    )}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl text-slate-900 text-lg transition-all outline-none",
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                            : "border-slate-100 focus:border-[#008751] focus:ring-4 focus:ring-[#008751]/10"
                    )}
                    maxLength={11}
                    disabled={loading}
                    autoFocus
                />
            </div>

            {error && (
                <p className="text-red-500 text-sm font-medium pl-1 animate-in slide-in-from-top-1">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading || !isInputValid || !isOnline}
                className={cn(
                    "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                    "bg-[#008751] hover:bg-[#007043] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-[#008751]/20"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Securing Connection...</span>
                    </>
                ) : (
                    <>
                        <Search className="h-5 w-5" />
                        <span>{!isOnline ? "Connect to Internet" : "Verify & Generate Slip"}</span>
                    </>
                )}
            </button>

            <p className="text-center text-slate-400 text-xs">
                Your data is encrypted and handled securely.
            </p>
        </form>
    );
}
