"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { ShieldCheck, Lock, Loader2, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if session exists (Supabase should have set it via the recovery link)
  useEffect(() => {
    // Optional: could add an extra check here but Supabase handles the recovery link automatically
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setError("");
    setLoading(true);

    const result = await updatePassword(newPassword);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
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
          <div className="text-center mb-10">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              success ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'
            }`}>
              {success ? <CheckCircle2 className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
            </div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {success ? "Success!" : "Reset Password"}
            </h1>
            <p
              className="text-sm mt-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {success 
                ? "Your password has been updated. Redirecting to login..." 
                : "Create a strong new password for your account."}
            </p>
          </div>

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="input-field h-14 pl-12 bg-bg-secondary/30"
                    placeholder="••••••"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-[10px] font-black text-text-muted uppercase tracking-widest pl-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input-field h-14 pl-12 bg-bg-secondary/30"
                    placeholder="••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold leading-tight">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full h-14 btn-primary flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-primary-100"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          )}

          {success && (
            <div className="mt-8">
              <div className="h-1 bg-emerald-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-progress origin-left"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
