"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const reference = searchParams.get("reference");

    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (!reference) {
            setStatus("error");
            setErrorMsg("Missing transaction reference.");
            return;
        }

        const verifyPayment = async () => {
            try {
                const { verifyPaymentAction } = await import("@/actions/wallet");
                const result = await verifyPaymentAction(reference);

                if (result.success) {
                    setStatus("success");
                    setTimeout(() => {
                        router.push("/wallet");
                    }, 3000);
                } else {
                    setStatus("error");
                    setErrorMsg(result.error);
                }
            } catch (err) {
                setStatus("error");
                setErrorMsg("Verification failed. Please try again or contact support.");
            }
        };

        verifyPayment();
    }, [reference, router]);

    return (
        <div className="max-w-md w-full glass-card p-10 text-center animate-in">
            {status === "verifying" && (
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Verifying Payment</h1>
                    <p className="text-text-muted">Please wait while we confirm your transaction...</p>
                </div>
            )}

            {status === "success" && (
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-accent-green text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-accent-green/20">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Payment Successful!</h1>
                        <p className="text-text-muted mt-2 leading-relaxed">
                            Your transaction <strong>{reference}</strong> was successful. Your wallet balance will be updated in a moment.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link
                            href="/wallet"
                            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                        >
                            Go to Wallet
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Redirecting in 3 seconds...</p>
                </div>
            )}

            {status === "error" && (
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <XCircle className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">Transaction Issue</h1>
                        <p className="text-text-muted mt-2">
                            {errorMsg || "We couldn't find a valid transaction reference. If you've been charged, please contact support."}
                        </p>
                    </div>
                    <div className="pt-4">
                        <Link
                            href="/wallet"
                            className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
                        >
                            Back to Wallet
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PaymentCallbackPage() {
    return (
        <div className="min-h-[85vh] flex items-center justify-center px-4">
            <Suspense fallback={
                <div className="max-w-md w-full glass-card p-10 text-center">
                    <div className="w-16 h-16 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary">Loading...</h1>
                </div>
            }>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
