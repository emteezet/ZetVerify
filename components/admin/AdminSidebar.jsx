"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import {
    LayoutDashboard,
    Users,
    CreditCard,
    BarChart3,
    ShieldCheck,
    Settings,
    LogOut,
    X,
    Menu,
    Zap,
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Overview",       href: "/admin",                icon: LayoutDashboard },
    { label: "Users",          href: "/admin/users",          icon: Users },
    { label: "Transactions",   href: "/admin/transactions",   icon: CreditCard },
    { label: "Analytics",      href: "/admin/analytics",      icon: BarChart3 },
    { label: "Identity Logs",  href: "/admin/verifications",  icon: ShieldCheck },
    { label: "Settings",       href: "/admin/settings",       icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href) =>
        href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

    const NavLink = ({ item }) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
            <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    active
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
            >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${active ? "text-white" : "text-slate-500 group-hover:text-indigo-400"}`} size={18} />
                <span className="tracking-tight">{item.label}</span>
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />}
            </Link>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo / Brand */}
            <div className="px-4 pt-6 pb-8">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-white font-black text-sm tracking-tight leading-none">ZetVerify</p>
                        <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest">Admin</p>
                    </div>
                </div>
            </div>

            {/* Nav Section */}
            <div className="px-3 flex-1 space-y-1 overflow-y-auto">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-3 mb-3">Navigation</p>
                {NAV_ITEMS.map((item) => (
                    <NavLink key={item.href} item={item} />
                ))}
            </div>

            {/* Footer — Exit + User */}
            <div className="px-3 pb-6 pt-4 border-t border-slate-800 space-y-1">
                <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
                >
                    <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                    <span>Exit Admin</span>
                </Link>

                {/* Admin user pill */}
                <div className="mt-4 flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xs uppercase shrink-0">
                        {user?.firstName?.[0] || user?.email?.[0] || "A"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white text-xs font-bold truncate">{user?.firstName || "Admin"}</p>
                        <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-900 text-slate-300 rounded-xl border border-slate-700 shadow-xl"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Drawer */}
            <aside className={`
                fixed left-0 top-0 h-full w-60 bg-slate-950 border-r border-slate-800/80 z-50
                transition-transform duration-300 md:hidden
                ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
            `}>
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-56 shrink-0 bg-slate-950 border-r border-slate-800/80 h-full">
                <SidebarContent />
            </aside>
        </>
    );
}
