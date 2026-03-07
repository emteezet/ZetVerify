"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import NinForm from "@/components/NinForm";

import PremiumPlasticCard from "@/components/PremiumPlasticCard";
import DownloadButton from "@/components/DownloadButton";
import { Shield, Fingerprint, Info, Loader2 } from "lucide-react";

export default function DashboardVerifyPage() {
    const router = useRouter();
    const { user, loading: authLoading, isAuthenticated } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const documentRef = useRef(null);

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
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 text-center">Verify NIN & Generate Slip</h1>
                    <p className="text-slate-500 text-center">Securely verify your National Identification Number and generate high-fidelity slips.</p>
                </div>

                <div className="flex flex-col gap-12">
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
                        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8">
                            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[3rem] border-2 border-slate-100 shadow-inner min-h-[450px]">
                                <div className="scale-75 sm:scale-100 lg:scale-[1.1] transition-all origin-center">
                                    <PremiumPlasticCard 
                                        user={userData} 
                                        qrCodeData={`NIN:${userData.nin}`} 
                                        forwardedRef={documentRef} 
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-center">
                                <DownloadButton 
                                    templateRef={documentRef} 
                                    fileName={`${userData.lastName}-ID`}
                                    slipType="plastic"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
