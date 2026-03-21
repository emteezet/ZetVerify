"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Info, Wallet } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase/client";
import PremiumPlasticCard from "@/components/PremiumPlasticCard";
import NinRegularSlip from "@/components/NinRegularSlip";
import ImprovedNinSlip from "@/components/ImprovedNinSlip";
import DownloadButton from "@/components/DownloadButton"; // Added the new smart button
import ProfilePreview from "@/components/ProfilePreview";

function VerifyContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slipType = searchParams.get("slipType") || "improved";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // 1. Create the reference for the DownloadButton to target
  const documentRef = useRef(null); 

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        // 1. Check for cached result from the Hub/Dashboard
        const cached = sessionStorage.getItem('nin-result');
        let resultData = null;

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.user?.nin === params.nin) {
                    resultData = parsed;
                }
            } catch (e) {
                console.error("Cache parse error", e);
            }
        }

        // 2. Fallback: Authenticate and fetch if no cache
        if (!resultData) {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            try {
                const res = await fetch(`/api/verify/${params.nin}`, {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {},
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                const json = await res.json();

                if (!res.ok) {
                    const errMsg = json.error || "Verification failed.";
                    const isInsufficient = json.code === 'INSUFFICIENT_BALANCE' || res.status === 402;
                    
                    throw new Error(errMsg, { cause: isInsufficient ? 'INSUFFICIENT_BALANCE' : (json.code || '') });
                }
                resultData = json;
            } catch (fetchErr) {
                if (fetchErr.name === 'AbortError') {
                    throw new Error("Verification request timed out. Please check your connection.");
                }
                throw fetchErr;
            }
        }

        // 3. Data Integrity Check
        const identityUser = resultData.user;
        const hasRequiredFields = identityUser && 
            identityUser.nin && 
            identityUser.firstName && 
            identityUser.lastName;

        if (!hasRequiredFields) {
            throw new Error("Invalid registry data. Essential fields are missing from the record.");
        }

        setData(resultData);
      } catch (err) {
        setError({ 
            message: err.message, 
            code: err.cause 
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.nin) {
      fetchVerification();
    }
  }, [params.nin]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent-green mx-auto mb-4" />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Verifying NIN...
          </p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div
          className="glass-card p-8 text-center max-w-md rounded-xl animate-in"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-in"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}
          >
            Verification Failed
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {error.message}
          </p>
          
          {error.code === 'INSUFFICIENT_BALANCE' ? (
              <Link
                href="/wallet"
                className="px-6 py-3 rounded-xl font-bold text-white transition-all text-center flex items-center justify-center gap-2 mb-3"
                style={{ background: "#0d6b0d" }}
              >
                <Wallet className="w-5 h-5" />
                Top up Wallet
              </Link>
          ) : (
              <Link
                href="/verify"
                className="px-4 py-2 rounded-lg font-medium text-white transition-all text-center block"
                style={{ background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)" }}
              >
                Try Another NIN
              </Link>
          )}

          {error.code === 'INSUFFICIENT_BALANCE' && (
              <Link href="/verify" className="text-xs font-bold text-slate-400 hover:text-slate-600">
                  Try another search
              </Link>
          )}
        </div>
      </div>
    );
  }

  // 4. Strip [UNENCRYPTED_DEV_MODE]: prefix on the frontend if present
  // (The full decryption happens on the server, but the frontend needs the raw string for rendering the slip)
  const displayUser = { ...data.user };
  if (displayUser.nin && displayUser.nin.startsWith('[UNENCRYPTED_DEV_MODE]:')) {
      displayUser.nin = displayUser.nin.replace('[UNENCRYPTED_DEV_MODE]:', '');
  }
  if (displayUser.bvn && displayUser.bvn.startsWith('[UNENCRYPTED_DEV_MODE]:')) {
      displayUser.bvn = displayUser.bvn.replace('[UNENCRYPTED_DEV_MODE]:', '');
  }

  const user = displayUser;
  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const dob = new Date(user.dob).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const generatedDate = data?.lastGenerated
    ? new Date(data.lastGenerated).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "N/A";

  return (
    <div className="min-h-[80vh] py-8 px-4">
      <div className="max-w-lg mx-auto">
        
        {/* Status Header */}
        <div className="text-center mb-8 animate-in text-slate-900">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d5ecd5, #eef7ee)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0d6b0d" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div className="badge-valid mx-auto mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            VALID
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}
          >
            Identity Verified
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>
            NIN: {user.nin || decodeURIComponent(params.nin)}
          </p>
        </div>

        {/* 2. Hidden visual ID cards rendered securely for PDF generation */}
        <div ref={documentRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
            {slipType === "premium" && (
                <div className="w-[500px] bg-white">
                  <PremiumPlasticCard user={user} qrCodeData={data?.qrCode} forwardedRef={documentRef} />
                </div>
            )}

            {slipType === "improved" && (
                <div className="w-[500px] bg-white">
                  <ImprovedNinSlip user={user} qrCodeData={data?.qrCode} forwardedRef={documentRef} />
                </div>
            )}
            
            {slipType === "regular" && (
                <div className="w-[850px] bg-white">
                  <NinRegularSlip user={user} forwardedRef={documentRef} />
                </div>
            )}
        </div>

        {/* 3. Display Profile Preview with custom DownloadButton rendering */}
        <div className="mt-8 flex justify-center w-full relative z-10">
            {(slipType === "premium" || slipType === "regular" || slipType === "improved") ? (
                <DownloadButton 
                    templateRef={documentRef} 
                    fileName={`NIN-Slip-${user.nin || params.nin}`} 
                    slipType={(slipType === "premium" || slipType === "improved") ? "plastic" : "full"} 
                    renderCustom={({ onClick, isLoading, error }) => (
                        <ProfilePreview
                            user={user}
                            idType="NIN"
                            idNumber={user.nin || decodeURIComponent(params.nin)}
                            onDownload={onClick}
                            isDownloading={isLoading}
                            error={error}
                        />
                    )}
                />
            ) : (
                <div className="p-6 glass-card text-center max-w-md w-full mx-auto">
                  <p className="text-slate-500">Please select a valid slip type to preview.</p>
                </div>
            )}
        </div>

        {/* New Search Button */}
        <div className="mt-8 flex justify-center no-print">
          <Link
            href="/verify"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border font-bold transition-all hover:bg-slate-50 active:scale-95"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-card)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            New Search
          </Link>
        </div>
      </div>
    </div>
  );
}

function VerifyField({ label, value }) {
  return (
    <div>
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center text-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent-green mx-auto mb-4" />
        <p className="text-text-muted">Loading verification details...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}