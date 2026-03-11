"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import PremiumPlasticCard from "@/components/PremiumPlasticCard";
import NinRegularSlip from "@/components/NinRegularSlip";
import DownloadButton from "@/components/DownloadButton"; // Added the new smart button

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
        const res = await fetch(`/api/verify/${params.nin}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Verification failed.");
          setLoading(false);
          return;
        }

        setData(json);
      } catch (err) {
        setError("Network error during verification.");
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
            {error}
          </p>
          <Link
            href="/verify"
            className="px-4 py-2 rounded-lg font-medium text-white transition-all text-center block"
            style={{ background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)" }}
          >
            Try Another NIN
          </Link>
        </div>
      </div>
    );
  }

  const user = data.user;
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
            NIN: {params.nin}
          </p>
        </div>

        {/* 2. Wrap the visual ID cards in the documentRef */}
        <div ref={documentRef} className="w-full flex justify-center">
            {slipType === "premium" && (
              <div className="mt-8 animate-in fade-in zoom-in duration-500 py-4 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl flex justify-center w-full max-w-lg">
                <div className="w-full max-w-[800px] scale-[0.6] sm:scale-100 origin-top flex justify-center items-center">
                  <PremiumPlasticCard user={user} qrCodeData={data?.qrCode} />
                </div>
              </div>
            )}
            
            {slipType === "regular" && (
              <div className="mt-8 animate-in fade-in zoom-in duration-500 w-full overflow-x-auto">
                <div className="min-w-[850px] origin-top scale-75 sm:scale-100">
                  <NinRegularSlip user={user} />
                </div>
              </div>
            )}
            
            {(slipType !== "premium" && slipType !== "regular") && (
              <div className="glass-card overflow-hidden animate-in animate-delay-1 max-w-lg w-full mt-8">
                <div className="h-1.5" style={{ background: "linear-gradient(90deg, #0d6b0d, #1a8c1a, #0d6b0d)" }} />
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b" style={{ borderColor: "var(--border-color)" }}>
                    <div className="w-16 h-16 rounded-xl border-2 flex items-center justify-center overflow-hidden flex-shrink-0" style={{ borderColor: "var(--accent-green)", backgroundColor: "var(--bg-secondary)" }}>
                      {user.photo && user.photo !== "/uploads/default-avatar.png" ? (
                        <img src={user.photo} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)", fontFamily: "Outfit, sans-serif" }}>
                        {fullName}
                      </h2>
                      <p className="text-sm font-mono" style={{ color: "var(--accent-green)" }}>
                        {user.nin}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b" style={{ borderColor: "var(--border-color)" }}>
                    <VerifyField label="Date of Birth" value={dob} />
                    <VerifyField label="Gender" value={user.gender} />
                    <VerifyField label="State" value={user.state} />
                    <VerifyField label="LGA" value={user.lga} />
                    <VerifyField label="Last Generated" value={generatedDate} />
                    <VerifyField label="Serial No." value={data.serialNumber || "—"} />
                  </div>

                  <div className="mb-6 pb-6 border-b" style={{ borderColor: "var(--border-color)" }}>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Selected Slip Type</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {slipType === "improved" ? "Improved NIN Slip" : "NIN Regular Slip"}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-3" style={{ backgroundColor: "var(--bg-secondary)" }}>
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Verified on {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })} — School Project Simulation
                  </p>
                </div>
              </div>
            )}
        </div>

        {/* 3. Drop in the new DownloadButton right under the card */}
        <div className="mt-8 flex justify-center">
            <DownloadButton 
                templateRef={documentRef} 
                fileName={`NIN-Slip-${params.nin}`} 
                slipType={slipType === "premium" ? "plastic" : "full"} 
            />
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