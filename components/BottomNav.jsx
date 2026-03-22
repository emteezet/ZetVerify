"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Wallet, 
  History, 
  UserCircle 
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Services", href: "/verify", icon: ShieldCheck },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Transactions", href: "/transactions", icon: History },
    { name: "Account", href: "/account-info", icon: UserCircle },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <nav 
      className="md:hidden fixed bottom-6 left-4 right-4 z-50 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300"
      style={{ 
        background: "rgba(var(--bg-card-rgb, 255, 255, 255), 0.85)", 
        borderColor: "rgba(var(--border-color-rgb, 229, 231, 235), 0.5)",
        boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.2)"
      }}
    >
      <div className="flex justify-between items-center max-w-lg mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center gap-1.5 transition-all duration-300 ease-out py-1 px-2"
              style={{
                color: active ? "var(--accent-green)" : "var(--text-secondary)",
                minWidth: "60px"
              }}
            >
              {/* Active Indicator Background */}
              {active && (
                <div 
                  className="absolute inset-0 rounded-xl -z-10 animate-in fade-in zoom-in duration-300"
                  style={{ background: "var(--accent-green-glow)" }}
                />
              )}
              
              <div 
                className={`relative transition-all duration-300 ${active ? '-translate-y-1' : ''}`}
              >
                <Icon 
                  size={active ? 26 : 24} 
                  strokeWidth={active ? 2.5 : 2} 
                  className={`transition-all duration-300 ${active ? 'filter drop-shadow-[0_0_8px_rgba(13,107,13,0.3)]' : ''}`}
                />
                
                {/* Active Dot */}
                {active && (
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-green-600 rounded-full animate-pulse" />
                )}
              </div>
              
              <span 
                className={`text-[11px] font-semibold tracking-wide transition-all duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}
                style={{ 
                  fontFamily: "Outfit, sans-serif" 
                }}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
