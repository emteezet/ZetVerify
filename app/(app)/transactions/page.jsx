"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import TransactionList from "@/components/dashboard/TransactionList";
import { getTransactionsAction } from "@/actions/wallet";
import { LayoutDashboard, ArrowUpRight, ArrowDownLeft, Activity } from "lucide-react";

export default function TransactionsPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ total: 0, credits: 0, debits: 0, totalSpent: 0 });
  const [refreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  // Fetch real stats from live transactions
  useEffect(() => {
    if (!user?.id) return;
    getTransactionsAction(user.id).then((result) => {
      if (result.success) {
        const txns = result.transactions;
        const credits = txns.filter(t => Number(t.amount) > 0);
        const debits = txns.filter(t => Number(t.amount) < 0);
        setStats({
          total: txns.length,
          credits: credits.length,
          debits: debits.length,
          totalSpent: debits.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0),
        });
      }
    });
  }, [user?.id, refreshTrigger]);

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
            <span>Identity Portal / Transactions</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Transactions
          </h1>
          <p className="text-white/70 text-lg">
            Full audit log of your wallet activity and identity verifications.
          </p>
        </div>
      </div>

      {/* Stats + Table */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 space-y-8">
        {/* Live Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="p-3 bg-accent-green-light rounded-xl">
              <Activity className="w-6 h-6 text-accent-green" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold tracking-wide">Total Transactions</p>
              <p className="text-3xl font-bold text-text-primary mt-1">{stats.total}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold tracking-wide">Credits (Funding)</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.credits}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <ArrowUpRight className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase font-bold tracking-wide">Total Spent</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">₦{stats.totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Live Transaction Table */}
        <TransactionList
          userId={user.id}
          refreshTrigger={refreshTrigger}
          limit={10}
        />
      </div>
    </div>
  );
}
