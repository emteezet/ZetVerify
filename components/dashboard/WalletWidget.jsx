"use client";

import { useState, useEffect } from "react";
import { Wallet, Plus, CreditCard, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { getBalanceAction, initializePaymentAction } from "../../actions/wallet";
import { useNotification } from "../NotificationContext";
import { useAuth } from "../AuthContext";

export default function WalletWidget({ userId, userEmail }) {
    const { showNotification } = useNotification();
    const { isOnline } = useAuth();
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFundInput, setShowFundInput] = useState(false);
    const [amount, setAmount] = useState("");
    const [isInitializing, setIsInitializing] = useState(false);

    const fetchBalance = async () => {
        setLoading(true);
        const result = await getBalanceAction(userId);
        if (result.success) {
            setBalance(result.balance);
        } else {
            showNotification(result.error, "error");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBalance();
    }, [userId]);

    const handleFund = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || Number(amount) < 100) {
            showNotification("Minimum funding amount is ₦100", "info");
            return;
        }

        setIsInitializing(true);
        const result = await initializePaymentAction(userEmail, Number(amount));

        if (result.success && result.data.authorization_url) {
            showNotification("Redirecting to payment gateway...", "success");
            // Redirect to Paystack checkout
            window.location.href = result.data.authorization_url;
        } else {
            showNotification(result.error || "Payment initialization failed", "error");
            setIsInitializing(false);
        }
    };

    return (
        <div className="glass-card p-6 w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-green-light rounded-lg">
                        <Wallet className="w-5 h-5 text-accent-green" />
                    </div>
                    <h3 className="font-semibold text-text-primary">Wallet Balance</h3>
                </div>
                <button
                    onClick={fetchBalance}
                    disabled={loading}
                    className="p-1.5 hover:bg-bg-secondary rounded-full transition-colors disabled:opacity-50"
                    title="Refresh Balance"
                >
                    <RefreshCw className={`w-4 h-4 text-text-muted ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="mb-6">
                <span className="text-text-muted text-sm block mb-1">Available Funds</span>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-text-primary">
                        ₦{balance?.toLocaleString() ?? "0.00"}
                    </span>
                    {loading && <div className="w-20 h-8 bg-bg-secondary animate-pulse rounded ml-2" />}
                </div>
            </div>

            {!showFundInput ? (
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setShowFundInput(true)}
                        disabled={!isOnline}
                        className="btn-primary flex items-center justify-center gap-2 py-3 text-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isOnline ? "Connect to internet to fund" : ""}
                    >
                        <Plus className="w-4 h-4" />
                        Fund
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 text-sm px-4 btn-secondary">
                        <CreditCard className="w-4 h-4" />
                        History
                    </button>
                </div>
            ) : (
                <form onSubmit={handleFund} className="space-y-3 animate-in">
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-medium">₦</span>
                        <input
                            type="number"
                            min="0"
                            value={amount}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || Number(val) >= 0) {
                                    setAmount(val);
                                }
                            }}
                            placeholder="Min. 100"
                            className="input-field py-2.5 pl-8 text-sm"
                            autoFocus
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isInitializing || !isOnline}
                            className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isInitializing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFundInput(false)}
                            className="btn-secondary px-4 py-2.5 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
