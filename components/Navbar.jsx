"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav
      className="no-print sticky top-0 z-50 backdrop-blur-lg border-b"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
        opacity: 0.98,
      }}
    >
      <div className="max-w-full mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
              style={{
                background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)",
              }}
            >
              NIN
            </div>
            <span
              className="text-lg font-semibold tracking-tight hidden md:block"
              style={{
                fontFamily: "Outfit, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              NIN Platform
            </span>
          </Link>

          {/* Right Side - Theme Toggle + Auth */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {!loading && (
              <>
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm hidden md:inline"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {user?.firstName || user?.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)",
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/auth/login"
                      className="text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg"
                      style={{
                        background: "linear-gradient(135deg, #0d6b0d, #1a8c1a)",
                      }}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
