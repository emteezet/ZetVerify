"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import NinForm from "@/components/NinForm";
import FullSlipTemplate from "@/components/FullSlipTemplate";
import PremiumPlasticCard from "@/components/PremiumPlasticCard";
import PdfGenerator from "@/components/PdfGenerator";
import { Shield, CreditCard, FileText, Fingerprint, Info, Loader2 } from "lucide-react";

export default function DashboardVerifyPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState("full");

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth/login");
        }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading) {
        return (
            <div className="min-h-[85vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#008751]" />
            </div>
        );
    }

    if (!user) return null;

    const handleVerify = async (nin) => {
        setLoading(true);
        setError("");
        setUserData(null);

        try {
            const response = await fetch("/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nin }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Verification failed");
            }

            setUserData(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] px-4 py-12 bg-[#f8fafc]">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Verify NIN & Generate Slip</h1>
                    <p className="text-slate-500">Securely verify your National Identification Number and generate high-fidelity slips.</p>
                </div>

                <div className="grid lg:grid-cols-1 gap-12">
                    {/* Input Section */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group max-w-2xl mx-auto w-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#008751]/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                        <NinForm onSubmit={handleVerify} loading={loading} />

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex gap-3 items-center">
                                <Info className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="mt-8 flex justify-center gap-8 text-slate-400">
                            <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#008751]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Fingerprint className="h-4 w-4 text-[#008751]" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Verified</span>
                            </div>
                        </div>
                    </div>

                    {/* Result Section */}
                    {userData && (
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="flex flex-col md:flex-row gap-10 items-start">
                                {/* Sidebar / Controls */}
                                <div className="w-full md:w-80 space-y-6 sticky top-24">
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-[#008751]" />
                                            Format Options
                                        </h3>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => setSelectedTemplate("full")}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate === "full" ? "border-[#008751] bg-[#008751]/5 ring-4 ring-[#008751]/10" : "border-slate-50 hover:bg-slate-50"}`}
                                            >
                                                <p className="font-bold text-sm">Full NIN Slip</p>
                                                <p className="text-xs text-slate-500">Vertical A4 format</p>
                                            </button>
                                            <button
                                                onClick={() => setSelectedTemplate("premium")}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedTemplate === "premium" ? "border-[#008751] bg-[#008751]/5 ring-4 ring-[#008751]/10" : "border-slate-50 hover:bg-slate-50"}`}
                                            >
                                                <p className="font-bold text-sm">Premium Digital ID</p>
                                                <p className="text-xs text-slate-500">Landscape card layout</p>
                                            </button>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-slate-100">
                                            <PdfGenerator
                                                targetId={selectedTemplate === "full" ? "full-slip-template" : "premium-slip-template"}
                                                fileName={`${userData.lastName}_NIN_${selectedTemplate}.pdf`}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-[#008751] rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/10">
                                        <CreditCard className="h-6 w-6 mb-4 opacity-50" />
                                        <h4 className="font-bold">NIMC Enrollment</h4>
                                        <p className="text-xs text-emerald-100 mt-2 leading-relaxed">This slip is valid for all official purposes. You can present it at any NIMC center for biometric updates.</p>
                                    </div>
                                </div>

                                {/* Preview Area */}
                                <div className="flex-1 bg-white p-4 md:p-10 rounded-[40px] border border-slate-200 overflow-auto flex justify-center min-h-[600px] shadow-inner">
                                    {selectedTemplate === "full" ? (
                                        <div className="shadow-2xl rounded-sm scale-[0.6] sm:scale-[0.8] lg:scale-90 origin-top">
                                            <FullSlipTemplate userData={userData} />
                                        </div>
                                    ) : (
                                        <div className="py-10 scale-[0.5] sm:scale-100">
                                            <PremiumPlasticCard userData={userData} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
