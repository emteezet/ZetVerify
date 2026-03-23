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

        {/* Upper Dashboard: Wallet */}
        <div className="mb-8">
          <div className="max-w-md animate-in animate-delay-2">
            <WalletWidget
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Actions */}
          <div className="animate-in animate-delay-3">
            <IdentityRequestForm
              onSuccess={handleRefreshBalance}
            />
          </div>

          <div className="animate-in animate-delay-3">
            <TransactionList
              refreshTrigger={refreshTrigger}
              limit={5}
              viewAllHref="/transactions"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

