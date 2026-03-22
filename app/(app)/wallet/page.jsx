"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import WalletWidget from "@/components/dashboard/WalletWidget";
import TransactionList from "@/components/dashboard/TransactionList";
import { Wallet, LayoutDashboard } from "lucide-react";

export default function WalletPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-3">
            <LayoutDashboard className="w-4 h-4" />
            <span>Identity Portal / Wallet</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Wallet
          </h1>
          <p className="text-white/70 text-lg">
            Manage your balance and fund your account to continue verifying identities.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Wallet Card */}
          <div className="lg:col-span-4">
            <WalletWidget
              userId={user.id}
              userEmail={user.email}
              refreshTrigger={refreshTrigger}
              onFunded={() => setRefreshTrigger(p => p + 1)}
            />
          </div>

          {/* Info Panel */}
          <div className="lg:col-span-8 space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-accent-green" />
                How Funding Works
              </h3>
              <ul className="space-y-3 text-sm text-text-muted">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-accent-green-light text-accent-green rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  Click <strong className="text-text-primary">Fund</strong> on your wallet and enter an amount (minimum ₦100).
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-accent-green-light text-accent-green rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  You'll be redirected to <strong className="text-text-primary">Paystack</strong> to complete payment securely.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-accent-green-light text-accent-green rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  Your balance is credited instantly and you're returned to the dashboard.
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-accent-green-light text-accent-green rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                  Each NIN or BVN verification costs <strong className="text-text-primary">₦100</strong> and is deducted automatically.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <TransactionList
          userId={user.id}
          refreshTrigger={refreshTrigger}
          limit={10}
        />
      </div>
    </div>
  );
}
