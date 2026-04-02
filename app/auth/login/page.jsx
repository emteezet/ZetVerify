"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Remember Me: Load email on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('zetverify_remember_email');
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('zetverify_remember_email', formData.email);
      } else {
        localStorage.removeItem('zetverify_remember_email');
      }

      const isAdmin = formData.email.toLowerCase().trim() === "emteezetdesigns@gmail.com";
      router.push(isAdmin ? "/admin" : "/dashboard");
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-4 py-20">
        <div
          className="glass-card w-full max-w-md p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="/ZetVerify-logo icon.png"
              alt="ZetVerify"
              className="w-16 h-16 mx-auto mb-4 object-contain"
            />
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome Back
            </h1>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border transition-all"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 rounded-lg border transition-all"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
                placeholder="••••••"
              />
              <div className="flex justify-end mt-1">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium text-[#24718A] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#24718A] focus:ring-[#24718A]"
              />
              <label
                htmlFor="rememberMe"
                className="text-xs font-medium cursor-pointer"
                style={{ color: "var(--text-secondary)" }}
              >
                Remember me
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-lg text-sm flex items-start gap-3"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="flex-shrink-0 mt-0.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-white transition-all disabled:opacity-50"
              style={{
                background: loading
                  ? "rgba(25, 50, 92, 0.5)"
                  : "linear-gradient(135deg, #19325C, #24718A)",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--border-color)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              OR
            </span>
            <div
              className="flex-1 h-px"
              style={{ backgroundColor: "var(--border-color)" }}
            />
          </div>

          {/* Signup Link */}
          <p
            className="text-center text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-medium text-[#24718A] hover:opacity-80 transition-colors"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
