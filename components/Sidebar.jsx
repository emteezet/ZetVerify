"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";

export default function Sidebar() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    {
      name: "Services",
      icon: "🔒",
      subItems: [
        { name: "Verify NIN", href: "/verify" },
        { name: "Verify BVN", href: "/verify?type=bvn" },
      ],
    },
    { name: "Wallet", href: "/wallet", icon: "💳" },
    { name: "Transaction", href: "/transactions", icon: "📈" },
    { name: "Account Info", href: "/account-info", icon: "👤" },
  ];

  const isActive = (href) => pathname === href;

  // Don't show sidebar if loading or not authenticated
  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 transition-all duration-300 ease-in-out hidden md:block"
        style={{
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-color)",
          zIndex: 40,
        }}
      >
        <nav className="h-full flex flex-col p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.name || item.href}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    className={`w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between text-sm font-medium`}
                    style={{
                      background: servicesOpen
                        ? "linear-gradient(135deg, rgba(13, 107, 13, 0.15), rgba(26, 140, 26, 0.1))"
                        : "transparent",
                      color: servicesOpen ? "#0d6b0d" : "var(--text-secondary)",
                      borderLeft: servicesOpen
                        ? "3px solid #0d6b0d"
                        : "3px solid transparent",
                      paddingLeft: servicesOpen ? "13px" : "16px",
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`transition-transform duration-300 ${servicesOpen ? "rotate-180" : ""
                        }`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {servicesOpen && (
                    <div className="pl-4 mt-1 space-y-1 animate-in">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm block`}
                          style={{
                            background: isActive(subItem.href)
                              ? "linear-gradient(135deg, rgba(13, 107, 13, 0.15), rgba(26, 140, 26, 0.1))"
                              : "transparent",
                            color: isActive(subItem.href)
                              ? "#0d6b0d"
                              : "var(--text-secondary)",
                            borderLeft: isActive(subItem.href)
                              ? "3px solid #0d6b0d"
                              : "3px solid transparent",
                            paddingLeft: isActive(subItem.href)
                              ? "13px"
                              : "16px",
                          }}
                        >
                          <span>•</span>
                          <span>{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm font-medium`}
                  style={{
                    background: isActive(item.href)
                      ? "linear-gradient(135deg, rgba(13, 107, 13, 0.15), rgba(26, 140, 26, 0.1))"
                      : "transparent",
                    color: isActive(item.href)
                      ? "#0d6b0d"
                      : "var(--text-secondary)",
                    borderLeft: isActive(item.href)
                      ? "3px solid #0d6b0d"
                      : "3px solid transparent",
                    paddingLeft: isActive(item.href) ? "13px" : "16px",
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>
      </aside>

    </>
  );
}
