"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import NinForm from "@/components/NinForm";
import PlasticBvn from "@/components/PlasticBvn";
import BvnRegularSlip from "@/components/BvnRegularSlip";
import ImprovedNinSlip from "@/components/ImprovedNinSlip";
import DownloadButton from "@/components/DownloadButton";
import ProfilePreview from "@/components/ProfilePreview";
import { Loader2, Info, Wallet } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase/client";

function BVNContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slipType = searchParams.get("slipType") || "slip";
  const documentRef = useRef(null);

  const { isAuthenticated, loading: authLoading } = useAuth();

  // 0. Redirection Logic
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
        window.location.href = "/auth/login";
    }
  }, [authLoading, isAuthenticated]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!params.bvn) {
      setLoading(false);
      setShowForm(true);
      return;
    }

    const fetchVerification = async () => {
      try {
        // 1. Check for cached result from the Hub
        const cached = sessionStorage.getItem('nin-result');
        let resultData = null;

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Compare with decrypted bvn/nin and encrypted fullNin
                const match = (parsed.user?.bvn === params.bvn) || 
                              (parsed.user?.nin === params.bvn) || 
                              (parsed.user?.fullNin === params.bvn) || 
                              (encodeURIComponent(parsed.user?.fullNin) === params.bvn);
                
                if (match) {
                    resultData = parsed;
                }
            } catch (e) {
                console.error("BVN Cache parse error", e);
            }
        }

        // 2. Fallback: Authenticate and fetch
        if (!resultData) {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            try {
                // Use the dedicated dynamic GET route
                const res = await fetch(`/api/verify-bvn/${params.bvn}`, {
                    method: "GET",
                    headers: token ? { "Authorization": `Bearer ${token}` } : {},
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const json = await res.json();

                if (!res.ok) {
                    const errMsg = json.error || "BVN Verification failed.";
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
            (identityUser.bvn || identityUser.nin) && 
            identityUser.firstName && 
            identityUser.lastName;

        if (!hasRequiredFields) {
            throw new Error("Invalid registry data. Essential fields are missing from the official record.");
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

    fetchVerification();
  }, [params.bvn]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-green mx-auto mb-4" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Verifying BVN...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div
          className="glass-card p-8 text-center max-w-md"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Verification Failed
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
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
                href="/verify-bvn"
                className="px-4 py-2 rounded-lg font-medium text-white block text-center"
                style={{
                  background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)",
                }}
              >
                Try Again
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

  if (showForm && !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Verify BVN
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>
              Enter your 11-digit Bank Verification Number to verify your
              details
            </p>
          </div>

          <div
            className="glass-card p-6 rounded-xl"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
            }}
          >
            <NinForm
              onSubmit={(value) => {
                setLoading(true); // Reuse existing loading state or use a local one
                router.push(`/verify-bvn/${value}`);
              }}
              loading={loading}
              placeholder="11-digit BVN"
              buttonText="Verify BVN"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const bankDetails = data.bankDetails || {};
  const verifiedDate = data.verifiedAt
    ? new Date(data.verifiedAt).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "N/A";

  // Strip [UNENCRYPTED_DEV_MODE]: prefix on the frontend if present
  const displayData = { ...data };
  if (displayData.nin && displayData.nin.startsWith('[UNENCRYPTED_DEV_MODE]:')) {
      displayData.nin = displayData.nin.replace('[UNENCRYPTED_DEV_MODE]:', '');
  }
  if (displayData.bvn && displayData.bvn.startsWith('[UNENCRYPTED_DEV_MODE]:')) {
      displayData.bvn = displayData.bvn.replace('[UNENCRYPTED_DEV_MODE]:', '');
  }
  if (displayData.tracking_id && displayData.tracking_id.startsWith('[UNENCRYPTED_DEV_MODE]:')) {
      displayData.tracking_id = displayData.tracking_id.replace('[UNENCRYPTED_DEV_MODE]:', '');
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 gap-8">
      {/* Hidden container for PDF rendering */}
      <div ref={documentRef} style={{ position: "absolute", left: "-9999px", top: 0 }}>
        {slipType === "improved" && displayData && (
          <div className="w-[500px] bg-white">
            <ImprovedNinSlip
              user={{
                firstName: displayData.firstName || bankDetails.accountName?.split(' ')[1] || "IBRAHIM",
                lastName: displayData.lastName || bankDetails.accountName?.split(' ')[0] || "ADEBAYO",
                middleName: displayData.middleName || "",
                nin: displayData.nin || displayData.tracking_id || "00000000000",
                dob: displayData.dob || "1990-05-15",
                photo: displayData.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=BVN"
              }}
              forwardedRef={documentRef}
            />
          </div>
        )}

        {slipType === "premium" && displayData && (
          <div className="w-[500px] bg-white">
            <PlasticBvn
              user={{
                firstName: displayData.firstName || bankDetails.accountName?.split(' ')[1] || "IBRAHIM",
                lastName: displayData.lastName || bankDetails.accountName?.split(' ')[0] || "ADEBAYO",
                middleName: displayData.middleName || "",
                bvn: displayData.bvn,
                gender: displayData.gender || "M",
                dob: displayData.dob || "1990-05-15",
                photo: displayData.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=BVN"
              }}
              forwardedRef={documentRef}
            />
          </div>
        )}

        {slipType === "slip" && displayData && (
          <div className="w-[850px] bg-white">
            <BvnRegularSlip 
              user={{
                firstName: displayData.firstName || bankDetails.accountName?.split(' ')[1] || "IBRAHIM",
                lastName: displayData.lastName || bankDetails.accountName?.split(' ')[0] || "ADEBAYO",
                middleName: displayData.middleName || "",
                bvn: displayData.bvn,
                nin: displayData.nin || displayData.tracking_id || "18691733426",
                gender: displayData.gender || "MALE",
                dob: displayData.dob || "1996-09-04",
                phone: displayData.phone || "07036730633",
                state: displayData.state || "KATSINA STATE",
                lga: displayData.lga || "MATAZU",
                address: displayData.address || "SHARARRAR PIPE KOFAR KWAYA KATSINA",
                maritalStatus: displayData.maritalStatus || "SINGLE",
                photo: displayData.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=BVN"
              }}
              forwardedRef={documentRef}
            />
          </div>
        )}
      </div>

      {/* Visible Profile Preview with Custom Download Button Layering */}
      <div className="w-full max-w-md relative z-10 mx-auto">
        {data && (slipType === "improved" || slipType === "premium" || slipType === "slip") ? (
          <DownloadButton
            templateRef={documentRef}
            fileName={`${bankDetails.accountName}-BVN-${slipType === "slip" ? "Slip" : "ID"}`}
            slipType={slipType === "slip" ? "full" : "plastic"}
            renderCustom={({ onClick, isLoading, error }) => (
              <ProfilePreview
                user={displayData}
                idType="BVN"
                idNumber={displayData.bvn || decodeURIComponent(params.bvn)}
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
    </div>
  );
}

export default function VerifyBVNPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center text-center">
        <Loader2 className="w-10 h-10 animate-spin text-accent-green mx-auto mb-4" />
        <p className="text-text-muted">Loading verification details...</p>
      </div>
    }>
      <BVNContent />
    </Suspense>
  );
}

