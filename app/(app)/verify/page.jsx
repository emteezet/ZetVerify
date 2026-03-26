"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

import {
  Hash, Phone, CreditCard, Star, ShieldCheck,
  ChevronRight, AlertCircle, Loader2, FileText, UserCheck, Wallet
} from "lucide-react";
import Link from "next/link";

const SERVICE_TABS = [
  { value: "nin", label: "NIN Verification", icon: ShieldCheck },
  { value: "bvn", label: "BVN Verification", icon: UserCheck },
];

const NIN_SLIP_TYPES = [
  {
    value: "improved",
    label: "Improved Slip",
    description: "Enhanced format with QR code",
    icon: Star,
    badge: "New",
  },
  {
    value: "premium",
    label: "Premium Slip",
    description: "High-quality plastic ID card",
    icon: CreditCard,
    badge: "Popular",
  },
  {
    value: "regular",
    label: "Regular Slip",
    description: "Standard digital NIN slip",
    icon: FileText,
    badge: null,
  },
];

const BVN_SLIP_TYPES = [
  {
    value: "slip",
    label: "Regular Slip",
    description: "Standard digital BVN slip",
    icon: FileText,
    badge: null,
  },
  {
    value: "premium",
    label: "Premium Slip",
    description: "High-quality plastic ID card",
    icon: CreditCard,
    badge: "Popular",
  },
];

const NIN_SEARCH_TABS = [
  { value: "nin", label: "NIN Number", icon: Hash },
  { value: "phone", label: "Phone Number", icon: Phone },
];

const BVN_SEARCH_TABS = [
  { value: "bvn", label: "BVN Number", icon: Hash },
  { value: "phone", label: "Phone Number", icon: Phone },
];

function HubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [serviceType, setServiceType] = useState("nin");
  const [searchTab, setSearchTab] = useState("nin");
  const [idValue, setIdValue] = useState("");
  const [slipType, setSlipType] = useState("premium");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isSubmitting = useRef(false);

  // Authentication Protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Sync with URL params
  useEffect(() => {
    if (!isAuthenticated) return;
    const type = searchParams.get("type");
    const id = searchParams.get("id");
    const searchBy = searchParams.get("searchBy");
    const slip = searchParams.get("slipType");

    if (type === "bvn") {
      setServiceType("bvn");
      setSlipType(slip || "slip");
      setSearchTab(searchBy === "phone" ? "phone" : "bvn");
    } else if (type === "nin") {
      setServiceType("nin");
      setSlipType(slip || "premium");
      setSearchTab(searchBy === "phone" ? "phone" : "nin");
    }

    if (id) setIdValue(id);
  }, [searchParams]);

  const handleIdChange = (e) => {
    setIdValue(e.target.value.replace(/\D/g, "").slice(0, 11));
    setError("");
  };

  const handleServiceSwitch = (type) => {
    setServiceType(type);
    setSearchTab(type === "nin" ? "nin" : "bvn");
    setSlipType(type === "nin" ? "premium" : "slip");
    setIdValue("");
    setError("");
    setConsent(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();

    const label = serviceType === "nin" 
        ? (searchTab === "phone" ? "phone number" : "NIN")
        : (searchTab === "phone" ? "phone number" : "BVN");

    if (!idValue) {
      setError({ message: `Please enter your ${label}` });
      return;
    }

    if (idValue.length !== 11) {
      setError({ message: `${label} must be exactly 11 digits` });
      return;
    }

    if (!consent) {
      setError({ message: "Please accept the terms and conditions" });
      return;
    }

    if (isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);
    setError(null);

    try {
      // 1. Get authentication session
      const { supabase } = await import("@/lib/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      // 2. Map to correct API endpoint
      let endpoint = "/api/verify";
      let payload = { nin: idValue };

      if (serviceType === "nin") {
        if (searchTab === "phone") {
          endpoint = "/api/verify-nin-phone";
          payload = { phone: idValue };
        } else {
          endpoint = "/api/verify";
          payload = { nin: idValue };
        }
      } else {
        // BVN
        if (searchTab === "phone") {
          endpoint = "/api/verify-bvn-phone";
          payload = { phone: idValue };
        } else {
          endpoint = "/api/verify-bvn";
          payload = { bvn: idValue };
        }
      }
      
      // 3. Set up timeout (25 seconds - aggregator can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      // 4. Perform the verification (and wallet debit)
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const resultData = await res.json();

        if (!res.ok) {
          const err = new Error(resultData.error || "Verification failed");
          err.cause = resultData.code;
          throw err;
        }

        // 5. Data Integrity Check
        const identityUser = resultData.user;
        const hasRequiredFields = identityUser && 
          (identityUser.nin || identityUser.bvn) && 
          identityUser.firstName && 
          identityUser.lastName;

        if (!hasRequiredFields) {
           throw new Error("Invalid registry data. Some essential information is missing from the official record.");
        }

        // 6. Save result for the next page to use (cache)
        sessionStorage.setItem('nin-result', JSON.stringify({
          ...resultData,
          user: identityUser,
          verifiedAt: new Date().toISOString(),
          slipType,
          searchBy: searchTab
        }));

        // 7. Redirect based on type (Using encrypted identifier for URL)
        const secureId = identityUser.fullNin || encodeURIComponent(identityUser.nin || identityUser.bvn);

        if (serviceType === "nin") {
          router.push(`/verify/${secureId}?slipType=${slipType}&searchBy=${searchTab}`);
        } else {
          router.push(`/verify-bvn/${secureId}?slipType=${slipType}`);
        }
      } catch (fetchErr) {
        if (fetchErr.name === 'AbortError') {
          throw new Error("Verification request timed out. The identity registry is currently slow. Please try again.");
        }
        throw fetchErr;
      }

    } catch (err) {
      setError({ 
        message: err.message, 
        code: err.cause 
      });
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  const searchTabs = serviceType === "nin" ? NIN_SEARCH_TABS : BVN_SEARCH_TABS;
  const slipTypes = serviceType === "nin" ? NIN_SLIP_TYPES : BVN_SLIP_TYPES;
  const maxLen = 11;

  return (
    <div className="max-w-lg w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg animate-in"
          style={{ background: "linear-gradient(135deg, #19325C, #24718A)" }}
        >
          {serviceType === "nin" ? <ShieldCheck className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {serviceType === "nin" ? "NIN Verification" : "BVN Verification"}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {serviceType === "nin"
            ? "Search by your NIN or registered phone number"
            : "Verify your identity using your Bank Verification Number"}
        </p>
      </div>

      <div
        className="glass-card rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border-color)" }}
      >
        {/* Service Type Tabs */}
        <div className="flex border-b" style={{ borderColor: "var(--border-color)" }}>
          {SERVICE_TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => handleServiceSwitch(value)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all ${serviceType === value
                ? "text-primary border-b-4 border-primary"
                : "text-text-muted hover:text-text-secondary bg-bg-secondary/30"
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleVerify} className="p-6 space-y-5 animate-in">

          {/* Search Method Tabs */}
          <div
            className="flex p-1.5 rounded-xl gap-1 mb-4 shadow-inner"
            style={{ background: "var(--bg-secondary)" }}
          >
            {searchTabs.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setSearchTab(value); setIdValue(""); }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                style={
                  searchTab === value
                    ? {
                      background: "#19325C",
                      color: "white",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }
                    : { color: "var(--text-muted)" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Input Field */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              {serviceType === "nin"
                ? (searchTab === "nin" ? "NIN Number" : "Phone Number")
                : (searchTab === "bvn" ? "BVN Number" : "Phone Number")}
            </label>
            <div
              className="flex items-center rounded-xl border-2 transition-all duration-200 focus-within:ring-2"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                "--tw-ring-color": "#19325C30",
              }}
            >
              <div className="pl-4 pr-2 py-3" style={{ color: "var(--text-muted)" }}>
                {searchTab === "phone" ? <Phone className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={idValue}
                onChange={handleIdChange}
                placeholder={
                  searchTab === "phone" 
                    ? "e.g. 08012345678" 
                    : (serviceType === "nin" ? "Enter 11-digit NIN" : "Enter 11-digit BVN")
                }
                maxLength={maxLen}
                className="flex-1 bg-transparent py-3 pr-4 text-sm focus:outline-none"
                style={{ color: "var(--text-primary)" }}
              />
              <div
                className="pr-4 text-xs font-mono"
                style={{ color: idValue.length === maxLen ? "#19325C" : "var(--text-muted)" }}
              >
                {idValue.length}/{maxLen}
              </div>
            </div>
          </div>

          {/* Slip Type Picker */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Select Template
            </label>
            <div className={`grid ${serviceType === "nin" ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
              {slipTypes.map(({ value, label, description, icon: Icon, badge }) => {
                const selected = slipType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSlipType(value)}
                    className="relative flex flex-col items-center text-center p-4 rounded-xl border-2 transition-all duration-200 gap-2"
                    style={{
                      borderColor: selected ? "#19325C" : "var(--border-color)",
                      background: selected ? "rgba(25, 50, 92, 0.08)" : "var(--bg-secondary)",
                    }}
                  >
                    {badge && (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-2 py-0.5 rounded-full text-white uppercase tracking-tighter"
                        style={{ background: "#19325C" }}
                      >
                        {badge}
                      </span>
                    )}
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
                      style={{
                        background: selected ? "rgba(36, 113, 138, 0.12)" : "var(--bg-card)",
                        color: selected ? "#19325C" : "var(--text-muted)",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p
                        className="text-[11px] font-bold leading-tight"
                        style={{ color: selected ? "#19325C" : "var(--text-primary)" }}
                      >
                        {label}
                      </p>
                      <p
                        className="text-[9px] mt-0.5 leading-tight opacity-70"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consent */}
          <label
            className="flex items-start gap-3 cursor-pointer group"
            htmlFor="consent-hub"
          >
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                id="consent-hub"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setError(""); }}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center border-2 transition-all duration-150"
                style={{
                  borderColor: consent ? "#19325C" : "var(--border-color)",
                  background: consent ? "#19325C" : "transparent",
                }}
              >
                {consent && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              I hereby declare that this information is mine and I consent to the verification fee of ₦150.
            </span>
          </label>

          {/* Error Message */}
          {error && (
            <div
              className="p-4 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
              
              {error.code === 'INSUFFICIENT_BALANCE' && (
                <Link
                  href="/wallet"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-primary-500 hover:underline"
                  style={{ color: "#19325C" }}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Top up your wallet →
                </Link>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #19325C, #24718A)",
              opacity: (loading || idValue.length < 11) ? 0.6 : 1,
              cursor: (loading || idValue.length < 11) ? "not-allowed" : "pointer",
              transform: loading ? "scale(0.98)" : "none"
            }}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
            ) : (
              <><ShieldCheck className="w-5 h-5" /> Proceed to Verification <ChevronRight className="w-4 h-4 opacity-50" /></>
            )}
          </button>
        </form>
      </div>

      {/* Tip */}
      <div
        className="mt-6 px-4 py-4 rounded-2xl flex items-start gap-3 border border-dashed"
        style={{ background: "rgba(25, 50, 92, 0.03)", borderColor: "rgba(25, 50, 92, 0.2)" }}
      >
        <span className="text-lg">💡</span>
        <div className="space-y-1">
          <p className="text-xs font-bold text-primary-500 uppercase tracking-wider">Registry Sync</p>
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
          <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-text-muted">Loading verification hub...</p>
        </div>
      }>
        <HubContent />
      </Suspense>
    </div>
  );
}

