'use client';

import { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PremiumPlasticCard from '@/components/PremiumPlasticCard';
import DownloadButton from '@/components/DownloadButton';
import { CheckCircle2, Search, ArrowLeft } from 'lucide-react';

export default function GeneratePage() {
    const router = useRouter();
    const [result, setResult] = useState(null);
    const documentRef = useRef(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('nin-result');
        if (!stored) {
            router.push('/');
            return;
        }
        try {
            setResult(JSON.parse(stored));
        } catch {
            router.push('/');
        }
    }, [router]);

    if (!result) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#008751]/20 border-t-[#008751] rounded-full animate-spin" />
            </div>
        );
    }

    const handleNewSearch = () => {
        sessionStorage.removeItem('nin-result');
        router.push('/');
    };

    return (
        <div className="min-h-screen py-12 px-4 bg-[#f8fafc]">
            <div className="max-w-5xl mx-auto">
                {/* Navigation */}
                <button
                    onClick={handleNewSearch}
                    className="flex items-center gap-2 text-sm font-bold mb-8 text-slate-500 hover:text-[#008751] transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    New Search
                </button>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Record Verified
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Identity Secured.
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Your official documents have been generated successfully.
                        </p>
                    </div>

                    <div className="flex bg-white p-4 rounded-2xl border border-slate-100 shadow-sm items-center gap-4">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                            <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Number</p>
                           <p className="font-bold text-slate-900">{result.serialNumber}</p>
                        </div>
                    </div>
                </div>

                {/* Master Component */}
                <div className="bg-white p-1 sm:p-2 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="p-6 md:p-12 flex flex-col items-center gap-12">
                         <div className="scale-75 sm:scale-100 lg:scale-[1.1] transition-all origin-center">
                            <PremiumPlasticCard 
                                user={result.user} 
                                qrCodeData={`NIN:${result.user.nin}`} 
                                forwardedRef={documentRef} 
                            />
                         </div>
                         
                         <DownloadButton 
                            templateRef={documentRef} 
                            fileName={`${result.user.lastName}-ID`}
                            slipType="plastic"
                         />
                    </div>
                </div>

                {/* Verification Summary */}
                <div className="mt-12 grid sm:grid-cols-2 gap-6">
                    <div className="bg-[#008751] p-8 rounded-[2.5rem] text-white overflow-hidden relative group">
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-700" />
                        <h3 className="text-xl font-bold mb-2">Verification URL</h3>
                        <p className="text-emerald-100/70 text-sm mb-6 leading-relaxed">
                            Use this permanent link to verify this identity record at any time.
                        </p>
                        <div className="flex items-center gap-2 bg-black/20 p-4 rounded-xl backdrop-blur-md border border-white/10 text-xs font-mono truncate">
                             <span className="truncate flex-1">
                                {typeof window !== 'undefined' ? window.location.origin : ''}/verify/{result.user.nin}
                             </span>
                             <button 
                                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/verify/${result.user.nin}`)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                             >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                             </button>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
                        <h3 className="text-xl font-bold mb-2">Security Notice</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Your NIN is a sensitive record. Only share these documents with trusted entities and official verification points.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                End-to-End Encrypted
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
