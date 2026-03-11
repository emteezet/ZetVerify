"use client";

import React, { useState } from "react";
import { Search, Loader2, Smartphone, Hash, UserSquare, Fingerprint } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const TABS = [
    { id: "nin", label: "NIN", icon: Hash, endpoint: "/api/verify" },
    { id: "phone", label: "Phone & BVN", icon: Smartphone, endpoint: "/api/verify-bvn-phone" },
    { id: "tracking", label: "Tracking ID", icon: Fingerprint, endpoint: "/api/verify-tracking" },
    { id: "demography", label: "Demographics", icon: UserSquare, endpoint: "/api/verify-demography" },
];

export default function UnifiedVerificationForm({ onSubmit, loading }) {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [formData, setFormData] = useState({});
    const [error, setError] = useState("");

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        // Basic filtering for numbers only on nin/phone tabs
        let parsedValue = value;
        if (activeTab.id === "nin" || activeTab.id === "phone") {
             parsedValue = value.replace(/[^\d]/g, "");
        }

        setFormData(prev => ({ ...prev, [name]: parsedValue }));
        setError("");
    };

    const isFormValid = () => {
        if (activeTab.id === "nin") return formData.nin?.length === 11;
        if (activeTab.id === "phone") return formData.phone?.length === 11;
        if (activeTab.id === "tracking") return formData.tracking_id?.length > 4;
        if (activeTab.id === "demography") return formData.firstname && formData.lastname && formData.dob;
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid()) {
            setError("Please fill out all required fields correctly.");
            return;
        }

        onSubmit({ type: activeTab.id, endpoint: activeTab.endpoint, data: formData });
    };

    const renderInputs = () => {
        switch (activeTab.id) {
            case "nin":
                return (
                    <div className="relative animate-in slide-in-from-left-2 duration-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Hash className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            name="nin"
                            value={formData.nin || ""}
                            onChange={handleInputChange}
                            placeholder="Enter 11-Digit NIN"
                            maxLength={11}
                            disabled={loading}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl text-slate-900 text-lg transition-all outline-none border-slate-100 focus:border-[#008751] focus:ring-4 focus:ring-[#008751]/10"
                        />
                    </div>
                );
            case "phone":
                return (
                    <div className="relative animate-in slide-in-from-left-2 duration-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Smartphone className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone || ""}
                            onChange={handleInputChange}
                            placeholder="Enter 11-Digit Phone Number"
                            maxLength={11}
                            disabled={loading}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl text-slate-900 text-lg transition-all outline-none border-slate-100 focus:border-[#008751] focus:ring-4 focus:ring-[#008751]/10"
                        />
                    </div>
                );
            case "tracking":
                return (
                    <div className="relative animate-in slide-in-from-left-2 duration-300">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Fingerprint className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            name="tracking_id"
                            value={formData.tracking_id || ""}
                            onChange={handleInputChange}
                            placeholder="Enter Tracking ID (e.g. 7Y0OG2ZO003)"
                            disabled={loading}
                            className="w-full pl-12 pr-4 py-4 bg-white border-2 rounded-xl text-slate-900 text-lg transition-all outline-none border-slate-100 focus:border-[#008751] focus:ring-4 focus:ring-[#008751]/10"
                        />
                    </div>
                );
            case "demography":
                return (
                    <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname || ""}
                                onChange={handleInputChange}
                                placeholder="First Name"
                                disabled={loading}
                                className="w-full px-4 py-4 bg-white border-2 rounded-xl text-slate-900 transition-all outline-none border-slate-100 focus:border-[#008751]"
                            />
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname || ""}
                                onChange={handleInputChange}
                                placeholder="Last Name"
                                disabled={loading}
                                className="w-full px-4 py-4 bg-white border-2 rounded-xl text-slate-900 transition-all outline-none border-slate-100 focus:border-[#008751]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob || ""}
                                onChange={handleInputChange}
                                disabled={loading}
                                className="w-full px-4 py-4 bg-white border-2 rounded-xl text-slate-900 transition-all outline-none border-slate-100 focus:border-[#008751]"
                            />
                            <select
                                name="gender"
                                value={formData.gender || ""}
                                onChange={handleInputChange}
                                disabled={loading}
                                className="w-full px-4 py-4 bg-white border-2 rounded-xl text-slate-500 transition-all outline-none border-slate-100 focus:border-[#008751]"
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full flex flex-col gap-6">
            {/* Horizontal Floating Tabs */}
            <div className="bg-slate-100/50 p-1.5 rounded-2xl flex items-center justify-between gap-1 overflow-x-auto overflow-y-hidden hide-scrollbar">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab.id === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab);
                                setError("");
                                setFormData({});
                            }}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                isActive 
                                    ? "bg-white text-[#008751] shadow-sm ring-1 ring-slate-200/50" 
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            <Icon className={cn("w-4 h-4", isActive ? "scale-110" : "")} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Input View */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="min-h-[70px]">
                    {renderInputs()}
                </div>

                {error && (
                    <p className="text-red-500 text-sm font-medium pl-1 animate-in slide-in-from-top-1">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className={cn(
                        "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                        "bg-[#008751] hover:bg-[#007043] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-[#008751]/20"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Securing Identity Match...</span>
                        </>
                    ) : (
                        <>
                            <Search className="h-5 w-5" />
                            <span>Verify Identity</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
