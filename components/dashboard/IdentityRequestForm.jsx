"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Shield,
    Info,
    CheckCircle2,
    ChevronRight,
    Hash,
    Search
} from "lucide-react";

export default function IdentityRequestForm({ userId }) {
    const router = useRouter();
    const [identityType, setIdentityType] = useState("NIN");
    const [value, setValue] = useState("");

    const handleStartVerification = (e) => {
        e.preventDefault();
        if (value.length < 11) return;

        // Navigate to the unified verification hub with pre-filled data
        const typeParam = identityType.toLowerCase();
        router.push(`/verify?type=${typeParam}&id=${value}`);
    };

    return (
        <div className="glass-card p-8 w-full">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-accent-green-light rounded-lg">
                    <Shield className="w-6 h-6 text-accent-green" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-primary">Identity Verification</h2>
                    <p className="text-text-muted text-sm">Pre-fill details to start your verification process.</p>
                </div>
            </div>

            <form onSubmit={handleStartVerification} className="space-y-6 animate-in">
                <div className="flex gap-4 p-1 bg-bg-secondary rounded-xl w-fit">
                    {["NIN", "BVN"].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                setIdentityType(type);
                                setValue("");
                            }}
                            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${identityType === type
                                ? "bg-green-700 text-white shadow-md shadow-accent-green/20"
                                : "text-text-muted hover:text-text-primary"
                                }`}
                        >
                            {type === "NIN" ? "NIN (National ID)" : "BVN (Bank Verification)"}
                        </button>
                    ))}
                </div>

                <div className="relative">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider block mb-2">
                        Enter {identityType} Number
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            inputMode="numeric"
                            value={value}
                            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
                            placeholder={`Enter 11-digit ${identityType}`}
                            className="input-field pl-12 h-14 text-base"
                            required
                        />
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-text-muted">
                            {value.length}/11
                        </div>
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-accent-green/5 border border-accent-green/10 flex items-start gap-3">
                        <Info className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            Verification requires a <span className="font-bold text-text-primary">₦100</span> fee. You will be able to select your preferred slip template on the next page.
                        </p>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={value.length < 11}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 font-bold shadow-lg shadow-accent-green/20"
                >
                    <Search className="w-5 h-5" />
                    Find identity details
                    <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
            </form>
        </div>
    );
}
