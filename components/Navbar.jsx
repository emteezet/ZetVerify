"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthContext";
import { useUI } from "./UIContext";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const { toggleSidebar } = useUI();
  const pathname = usePathname();

  // Admin routes have their own shell — hide the shared Navbar
  if (pathname?.startsWith('/admin')) return null;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav
      className="no-print fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-color)",
        opacity: 0.98,
      }}
    >
      <div className="max-w-full mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle removed because of bottom MobileNav */}
            {/* Logo */}
            <Link href="/" className="flex items-center group">
              <img 
                src="/ZetVerify-landscape-logo.svg" 
                alt="ZetVerify Logo" 
                className="h-10 md:h-14 w-auto"
              />
            </Link>
          </div>

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
                        background: "linear-gradient(135deg, #19325C, #24718A)",
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
                        background: "linear-gradient(135deg, #19325C, #24718A)",
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
