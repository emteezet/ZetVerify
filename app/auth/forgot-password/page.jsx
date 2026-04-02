"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { ChevronLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendResetLink } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError("");
    setLoading(true);

    const result = await sendResetLink(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-20">
        <div
          className="glass-card w-full max-w-md p-10"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* Back Button */}
          <Link
            href="/auth/login"
            className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors mb-8 uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {!success ? (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-primary-600" />
                </div>
                <h1
                  className="text-2xl font-black tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  Forgot Password?
                </h1>
                <p
                  className="text-sm mt-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field h-14 bg-bg-secondary/30"
                    placeholder="your@email.com"
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-3">
                    <div className="p-1 bg-rose-600 text-white rounded-md">
                      <ChevronLeft className="w-3 h-3 rotate-180" />
                    </div>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-14 btn-primary flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-text-primary mb-4 tracking-tight">
                Check Your Email
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-10 px-4">
                We've sent a password reset link to <span className="font-bold text-text-primary">{email}</span>. Please check your inbox and spam folder.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs font-black text-[#24718A] uppercase tracking-widest hover:underline"
              >
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
