"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import NinForm from "@/components/NinForm";
import PremiumPlasticCard from "@/components/PremiumPlasticCard";
import DownloadButton from "@/components/DownloadButton";
import { Loader2 } from "lucide-react";

function BVNContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slipType = searchParams.get("slipType") || "slip";
  const documentRef = useRef(null);

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
        const res = await fetch(`/api/verify-bvn/${params.bvn}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "BVN verification failed.");
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
            {error}
          </p>
          <Link
            href="/verify-bvn"
            className="px-4 py-2 rounded-lg font-medium text-white block"
            style={{
              background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)",
            }}
          >
            Try Again
          </Link>
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
                router.push(`/verify-bvn/${value}`);
              }}
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

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 gap-8">
      {/* Premium View if selected */}
      {slipType === "premium" && data && (
        <div className="w-full max-w-lg mb-8 space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="scale-75 sm:scale-100 origin-center">
                    <PremiumPlasticCard 
                        user={{
                            firstName: bankDetails.accountName?.split(' ')[1] || "IBRAHIM",
                            lastName: bankDetails.accountName?.split(' ')[0] || "ADEBAYO",
                            nin: data.bvn, // Using BVN as ID for this template
                            gender: "M",
                            dob: "1990-05-15",
                            photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=BVN"
                        }} 
                        qrCodeData={`BVN:${data.bvn}`} 
                        forwardedRef={documentRef} 
                    />
                </div>
           </div>
           <div className="flex justify-center">
                <DownloadButton templateRef={documentRef} fileName={`${bankDetails.accountName}-BVN-ID`} slipType="plastic" />
           </div>
        </div>
      )}

      <div className="max-w-lg w-full">
        {/* Status */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d5ecd5, #eef7ee)" }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0d6b0d"
              strokeWidth="2.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3"
            style={{
              background: "rgba(13, 107, 13, 0.1)",
              color: "#0d6b0d",
            }}
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            VALID
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            BVN Verified
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            BVN: {params.bvn}
          </p>
        </div>

        {/* Details Card */}
        <div
          className="glass-card overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* Green bar */}
          <div
            className="h-1.5"
            style={{
              background: "linear-gradient(90deg, #0d6b0d, #1a8c1a, #0d6b0d)",
            }}
          />

          <div className="p-6">
            {/* Primary Info */}
            <div
              className="mb-6 pb-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Account Holder
              </h2>
              <div>
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Full Name
                </p>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {bankDetails.accountName || "N/A"}
                </p>
              </div>
            </div>

            {/* Bank Details */}
            <div
              className="mb-6 pb-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <h2
                className="text-lg font-semibold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Bank Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Bank Name
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {bankDetails.bankName || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Bank Code
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {bankDetails.bankCode || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Account Number
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {bankDetails.accountNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Account Type
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {bankDetails.accountType || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Details */}
            <div
              className="mb-6 pb-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Status
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#0d6b0d" }}
                  >
                    Active
                  </p>
                </div>
                <div>
                  <p
                    className="text-xs mb-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Verified Date
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {verifiedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Slip Type */}
            <div>
              <p
                className="text-xs mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Selected Slip Type
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {slipType === "slip"
                  ? "BVN Slip"
                  : "BVN Premium Slip (Plastic ID Card)"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3"
            style={{ backgroundColor: "var(--bg-secondary)" }}
          >
            <p
              className="text-xs text-center"
              style={{ color: "var(--text-secondary)" }}
            >
              Verified on{" "}
              {new Date().toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              — School Project Simulation
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/services"
            className="text-sm font-medium"
            style={{ color: "#0d6b0d" }}
          >
            Back to Services
          </Link>
        </div>
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

