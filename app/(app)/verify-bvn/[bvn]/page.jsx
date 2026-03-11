"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import UnifiedVerificationForm from "@/components/UnifiedVerificationForm";
import PlasticBvn from "@/components/PlasticBvn";
import DownloadButton from "@/components/DownloadButton";
import { Loader2 } from "lucide-react";
import { getMockByBvn } from "@/lib/mockData";

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
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let mockData = getMockByBvn(params.bvn);
        
        if (!mockData) {
          // Fallback to a default mock user to ensure testing always works
          const defaultMock = getMockByBvn("33333333333");
          mockData = {
            ...defaultMock,
            bvn: params.bvn,
          };
        }

        setData({
          bvn: mockData.bvn,
          verifiedAt: new Date().toISOString(),
          bankDetails: {
            accountName: `${mockData.lastName} ${mockData.firstName} ${mockData.middleName}`,
            bankName: "Guaranty Trust Bank",
            bankCode: "058",
            accountNumber: "0123456789",
            accountType: "Savings",
          },
          ...mockData
        });
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
            <UnifiedVerificationForm
              onSubmit={(payload) => {
                if (payload.type === 'phone') {
                   // This is a special edge case where if they use the phone tab on the bvn specific verify page, we can route it here
                   router.push(`/verify-bvn/${payload.data.phone}`);
                } else {
                   router.push(`/verify-bvn/${payload.data.nin || payload.data.phone || payload.data.tracking_id}`);
                }
              }}
              loading={loading}
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
                    <PlasticBvn 
                        user={{
                            firstName: data.firstName || bankDetails.accountName?.split(' ')[1] || "IBRAHIM",
                            lastName: data.lastName || bankDetails.accountName?.split(' ')[0] || "ADEBAYO",
                            middleName: data.middleName || "",
                            bvn: data.bvn, // Using BVN as ID for this template
                            gender: data.gender || "M",
                            dob: data.dob || "1990-05-15",
                            photo: data.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=BVN"
                        }} 
                        forwardedRef={documentRef} 
                    />
                </div>
           </div>
           <div className="flex justify-center">
                <DownloadButton templateRef={documentRef} fileName={`${bankDetails.accountName}-BVN-ID`} slipType="plastic" />
           </div>
        </div>
      )}

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

