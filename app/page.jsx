"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import {
    Shield,
    CreditCard,
    FileText,
    Fingerprint,
    Search,
    CheckCircle2,
    ArrowRight,
    Zap,
    Lock,
    QrCode,
    Smartphone
} from "lucide-react";

export default function HomePage() {
    const { isAuthenticated } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Helper to avoid hydration mismatch

    return (
        <main className="min-h-screen bg-white text-slate-900 selection:bg-[#19325C]/20 overflow-x-hidden">
            {/* Simple Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100/50 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/ZetVerify-landscape-logo.svg" alt="ZetVerify" className="h-10 md:h-14 w-auto" />
                    </Link>
                    <div className="flex items-center gap-6">
                        {!mounted ? (
                            // Server-side and Initial Client-side: Only "Get Started" to match default Guest state
                            <Link href="/auth/signup" className="bg-[#19325C] text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-[#19325C]/20 hover:bg-primary-600 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : isAuthenticated ? (
                            // Post-mount: Authenticated state
                            <Link href="/dashboard" className="bg-[#19325C] text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-[#19325C]/20 hover:bg-primary-600 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                Dashboard
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            // Post-mount: Guest state
                            <>
                                <Link href="/auth/login" className="text-sm font-bold text-slate-600 hover:text-[#19325C] transition-colors hidden md:block">
                                    Login
                                </Link>
                                <Link href="/auth/signup" className="bg-[#19325C] text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-xl shadow-[#19325C]/20 hover:bg-primary-600 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                    Get Started
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 px-6 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#19325C]/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left animate-in fade-in slide-in-from-left-8 duration-700">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-[#19325C]/5 border border-[#19325C]/10 rounded-full px-4 py-2 mb-8">
                                <Zap className="w-4 h-4 text-[#19325C]" />
                                <span className="text-[#19325C] text-xs font-black tracking-wider uppercase">
                                    Next-Gen Identity Verification
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.95]">
                                Secure Identity <br />
                                <span className="text-[#19325C]">Made Simple.</span>
                            </h1>

                            <p className="text-slate-500 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
                                Experience the fastest way to verify NIN and BVN records. Generate professional-grade digital IDs and slips with military-grade security.
                            </p>

                            <div className="flex flex-col md:flex-row gap-4">
                                <Link
                                    href={!mounted ? "/auth/login" : (isAuthenticated ? "/verify" : "/auth/login")}
                                    className="px-8 py-5 bg-[#19325C] text-white rounded-2xl font-black text-lg shadow-2xl shadow-[#19325C]/30 hover:bg-primary-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    <Search className="h-6 w-6" />
                                    Start Verification
                                </Link>
                                <div className="flex items-center gap-3 px-6 py-5 text-slate-400 font-bold">
                                    <Lock className="w-5 h-5" />
                                    Trusted by 10k+ users
                                </div>
                            </div>
                        </div>

                        {/* Interactive Illustration Placeholder */}
                        <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
                            <div className="relative z-10 p-4 md:p-8">
                                {/* Digital ID Card CSS Illustration */}
                                <div className="aspect-[1.6/1] bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col p-8 text-white relative group transition-transform hover:scale-[1.02] duration-500">
                                    {/* Holographic Mesh */}
                                    <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#19325C_0%,transparent_70%)]" />

                                    <div className="flex justify-between items-start relative z-10 mb-auto">
                                        <div className="flex flex-col gap-1">
                                            <div className="w-10 h-7 bg-white/10 rounded-md border border-white/20" />
                                            <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Digital Pass</span>
                                        </div>
                                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                            <QrCode className="w-7 h-7" />
                                        </div>
                                    </div>

                                    <div className="relative z-10 space-y-4">
                                        <div className="h-4 w-48 bg-white/20 rounded-full animate-pulse" />
                                        <div className="h-4 w-32 bg-white/10 rounded-full" />
                                        <div className="flex gap-4 pt-4 border-t border-white/5">
                                            <div className="h-2 w-16 bg-white/10 rounded-full" />
                                            <div className="h-2 w-16 bg-white/10 rounded-full" />
                                            <div className="ml-auto flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#19325C]" />
                                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Abstract Circles */}
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce shadow-emerald-100/50">
                                    <div className="w-10 h-10 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-xs font-black uppercase text-slate-400">Status</p>
                                        <p className="text-sm font-bold text-slate-900">NIN Verified</p>
                                    </div>
                                </div>

                                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 shadow-blue-100/50">
                                    <div className="w-10 h-10 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center">
                                        <Fingerprint className="w-6 h-6" />
                                    </div>
                                    <div className="hidden md:block">
                                        <p className="text-xs font-black uppercase text-slate-400">Security</p>
                                        <p className="text-sm font-bold text-slate-900">AES-256 Encrypted</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 bg-slate-50/50 relative border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-4">How it Works</h2>
                        <p className="text-slate-500 font-medium">Verify and generate your ID in three simple steps</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting Lines (Desktop only) */}
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 hidden md:block" />

                        {[
                            {
                                icon: <Search className="w-7 h-7" />,
                                title: "1. Search & Verify",
                                desc: "Enter your NIN or BVN number. We verify it instantly with official records.",
                                color: "emerald"
                            },
                            {
                                icon: <Smartphone className="w-7 h-7" />,
                                title: "2. Choose Format",
                                desc: "Select between Standard Slips, Premium IDs, or Improved Digital IDs.",
                                color: "blue"
                            },
                            {
                                icon: <FileText className="h-7 w-7" />,
                                title: "3. Generate PDF",
                                desc: "Download your high-fidelity PDF instantly, ready for printing or digital use.",
                                color: "indigo"
                            }
                        ].map((step, i) => (
                            <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center group hover:shadow-xl transition-all duration-300">
                                <div className={`w-16 h-16 rounded-2xl bg-${step.color}-50 text-${step.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Features */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 grid grid-cols-2 gap-6">
                            <div className="space-y-6 pt-12">
                                <div className="glass-card p-6 bg-primary-50/50 border-emerald-100 h-48 flex flex-col justify-end">
                                    <CreditCard className="w-8 h-8 text-primary-500 mb-2" />
                                    <h4 className="font-bold text-slate-900">HD Rendering</h4>
                                    <p className="text-xs text-slate-500">Crystal clear PDF generation.</p>
                                </div>
                                <div className="glass-card p-6 bg-slate-50 border-slate-100 h-48 flex flex-col justify-end">
                                    <Zap className="w-8 h-8 text-amber-500 mb-2" />
                                    <h4 className="font-bold text-slate-900">Instant Credit</h4>
                                    <p className="text-xs text-slate-500">Wallet funding in seconds.</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="glass-card p-6 bg-primary-50/50 border-blue-100 h-48 flex flex-col justify-end">
                                    <Lock className="w-8 h-8 text-primary-500 mb-2" />
                                    <h4 className="font-bold text-slate-900">Encrypted</h4>
                                    <p className="text-xs text-slate-500">Your data is safe with us.</p>
                                </div>
                                <div className="glass-card p-6 bg-indigo-50 border-indigo-100 h-48 flex flex-col justify-end">
                                    <Smartphone className="w-8 h-8 text-indigo-600 mb-2" />
                                    <h4 className="font-bold text-slate-900">Mobile First</h4>
                                    <p className="text-xs text-slate-500">Optimized for every screen.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-8 leading-tight">
                                Built for trust. <br />
                                Designed for speed.
                            </h2>
                            <p className="text-slate-500 text-lg mb-10 leading-relaxed">
                                Our platform uses industry-standard encryption and high-fidelity rendering engines to ensure every document you generate meets official specifications.
                            </p>

                            <div className="space-y-4">
                                {[
                                    "Official NIMC Template Compliant",
                                    "Dynamic QR Code Generation",
                                    "24/7 Automated Processing",
                                    "End-to-End Data Privacy"
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 font-bold text-slate-700">
                                        <div className="w-6 h-6 bg-[#19325C]/10 text-[#19325C] rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#19325C]/20 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/10 blur-[100px] pointer-events-none" />

                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tighter">
                            Ready to generate <br />
                            your digital ID?
                        </h2>
                        <div className="flex flex-col md:flex-row justify-center gap-4">
                            <Link
                                href="/auth/signup"
                                className="px-10 py-5 bg-[#19325C] text-white rounded-2xl font-black text-lg shadow-2xl shadow-[#19325C]/30 hover:bg-primary-600 transition-all"
                            >
                                Get Started Now
                            </Link>
                            <Link
                                href="/auth/login"
                                className="px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-lg hover:bg-white/10 transition-all"
                            >
                                Member Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-slate-100 flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 opacity-50">
                    <img src="/ZetVerify-landscape-logo.svg" alt="ZetVerify Logo" className="h-7 w-auto grayscale brightness-0" />
                </div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    © 2026 ZetVerify. Developed with ❤️ for secure identity.
                </p>
                <div className="flex gap-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <span className="hover:text-slate-900 cursor-pointer">Privacy Policy</span>
                    <span className="hover:text-slate-900 cursor-pointer">Terms of Service</span>
                    <span className="hover:text-slate-900 cursor-pointer">Legal</span>
                </div>
            </footer>
        </main>
    );
}
