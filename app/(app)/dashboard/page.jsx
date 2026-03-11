"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import WalletWidget from "@/components/dashboard/WalletWidget";
import IdentityRequestForm from "@/components/dashboard/IdentityRequestForm";
import TransactionList from "@/components/dashboard/TransactionList";
import Link from "next/link";
import { LayoutDashboard, ShieldCheck, History, Settings, Info } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshBalance = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="spinner text-accent-green! w-10! h-10! border-4" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-secondary/30 pb-20">
      {/* Hero Header */}
      <div className="gradient-hero pt-24 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="animate-in">
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Identity Portal / Dashboard</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Welcome, {user.firstName || user.email}!
              </h1>
              <p className="text-white/70 text-lg max-w-xl">
                Securely manage your identity verification requests and generate high-fidelity slips.
              </p>
            </div>

            <div className="animate-in animate-delay-1 flex items-center gap-3">
              <Link
                href="/transactions"
                title="View Transactions"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
              >
                <History className="w-5 h-5" />
              </Link>
              <Link
                href="/account-info"
                title="Account Settings"
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10 text-white backdrop-blur-md"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-6 -mt-16">

        {/* Upper Dashboard: Wallet & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-4 animate-in animate-delay-2">
            <WalletWidget
              userId={user.id || user._id}
              userEmail={user.email}
              refreshTrigger={refreshTrigger}
            />
          </div>

          <div className="lg:col-span-8 flex flex-col justify-between gap-6 animate-in animate-delay-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <div className="glass-card p-6 flex items-start gap-4 h-full">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary mb-1">NDPR Compliant</h4>
                  <p className="text-xs text-text-muted">Your identity data is encrypted and purged after session completion.</p>
                </div>
              </div>
              <div className="glass-card p-6 flex items-start gap-4 h-full">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-text-primary mb-1">Help Center</h4>
                  <p className="text-xs text-text-muted">Having issues with verification? Contact our support team 24/7.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left/Bottom Column: Main Actions */}
          <div className="lg:col-span-8 space-y-8 animate-in animate-delay-3">
            <IdentityRequestForm
              userId={user.id || user._id}
              onSuccess={handleRefreshBalance}
            />

            <TransactionList
              userId={user.id || user._id}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* Right/Sidebar Column: Status & Info */}
          <div className="lg:col-span-4 space-y-8 animate-in animate-delay-4">
            <div className="glass-card p-6">
              <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-accent-green" />
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">NIMC Registry</span>
                  <span className="text-accent-green font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Supabase Ledger</span>
                  <span className="text-accent-green font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Encryption Engine</span>
                  <span className="text-accent-green font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                    Secure
                  </span>
                </div>
              </div>
            </div>

            {/* Premium Promo or Extra Info */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0d6b0d] to-[#1a8c1a] text-white">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-1 italic">Verified Professional</h4>
              <p className="text-[10px] text-emerald-100 opacity-80 leading-relaxed uppercase tracking-widest font-black mb-4">Priority Infrastructure</p>
              <p className="text-xs text-emerald-50 opacity-90 leading-relaxed">
                You are currently using our Tier-1 verification engine with direct mirror access to terminal registries.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

