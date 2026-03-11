"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import UnifiedVerificationForm from "@/components/UnifiedVerificationForm";

function HubContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const handleVerify = (queryPayload) => {
    setLoading(true);

    // Simulated API delay
    setTimeout(() => {
        setLoading(false);
        
        // Allow bypassing auth in development for specific mocks
        const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true';
        
        if (devBypass) {
            // Forward the payload directly to the authenticated builder page
            router.push(`/dashboard/verify`); 
        } else {
            router.push("/auth/login?redirect=/dashboard/verify");
        }
    }, 1500);
  };

  return (
    <div className="max-w-lg w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg animate-in"
          style={{ background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)" }}
        >
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          Identity Verification
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Securely verify Nigerian Identities via NIN, BVN, Phone or Demographics
        </p>
      </div>

      <div
        className="glass-card rounded-2xl overflow-hidden p-6"
        style={{ border: "1px solid var(--border-color)", background: "var(--bg-card)" }}
      >
        <UnifiedVerificationForm onSubmit={handleVerify} loading={loading} />
      </div>

      {/* Tip */}
      <div
        className="mt-6 px-4 py-4 rounded-2xl flex items-start gap-3 border border-dashed"
        style={{ background: "rgba(13,107,13,0.03)", borderColor: "rgba(13,107,13,0.2)" }}
      >
        <span className="text-lg">💡</span>
        <div className="space-y-1">
          <p className="text-xs font-bold text-accent-green uppercase tracking-wider">Registry Sync</p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            All identity data is fetched in real-time from official NIMC and NIBSS registries. Please ensure you have sufficient balance in your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerificationHubPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="max-w-lg w-full text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent-green mx-auto mb-4" />
          <p className="text-text-muted">Loading verification hub...</p>
        </div>
      }>
        <HubContent />
      </Suspense>
    </div>
  );
}

