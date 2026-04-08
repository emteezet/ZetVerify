"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { useUI } from "./UIContext";
import { 
    LayoutDashboard, 
    ShieldCheck, 
    Wallet, 
    History, 
    Activity, 
    User, 
    ChevronDown, 
    ChevronRight,
    ArrowLeft,
    Users,
    Shield,
    X
} from "lucide-react";

export default function Sidebar() {
    const [servicesOpen, setServicesOpen] = useState(false);
    const pathname = usePathname();
    const { isAuthenticated, loading } = useAuth();
    const { isSidebarOpen, closeSidebar } = useUI();

    // Admin routes have their own dedicated sidebar
    if (pathname?.startsWith('/admin')) return null;

    const userMenuItems = [
        { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        {
            name: "Services",
            icon: <ShieldCheck className="w-5 h-5" />,
            subItems: [
                { name: "Verify NIN", href: "/verify" },
                { name: "Verify BVN", href: "/verify?type=bvn" },
            ],
        },
        { name: "Wallet", href: "/wallet", icon: <Wallet className="w-5 h-5" /> },
        { name: "Verification History", href: "/history", icon: <History className="w-5 h-5" /> },
        { name: "Transaction", href: "/transactions", icon: <Activity className="w-5 h-5" /> },
        { name: "Account Info", href: "/account-info", icon: <User className="w-5 h-5" /> },
    ];

    const menuItems = userMenuItems;

    const isActive = (href) => pathname === href;

    if (loading || !isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`
                fixed md:static left-0 top-0 h-full 
                w-64 transition-all duration-300 ease-in-out z-50 md:z-40
                bg-white border-r border-slate-200
                ${isSidebarOpen ? 'translate-x-0 shadow-2xl shadow-slate-900/20' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex flex-col h-full py-6 px-4">
                    {/* Mobile Header (Hidden on desktop) */}
                    <div className="md:hidden flex items-center justify-between mb-8 px-2">
                        <img 
                            src="/ZetVerify-landscape-logo.svg" 
                            alt="Logo" 
                            className="h-10 w-auto"
                        />
                        <button 
                            onClick={closeSidebar}
                            className="p-2 bg-slate-50 rounded-xl text-slate-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>



                    <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-2 pb-24 md:pb-6">
                        {menuItems.map((item) => (
                            <div key={item.name}>
                                {item.subItems ? (
                                    <>
                                        <button
                                            onClick={() => setServicesOpen(!servicesOpen)}
                                            className={`w-full px-4 py-3.5 rounded-2xl transition-all flex items-center justify-between text-sm group ${
                                                servicesOpen ? 'bg-slate-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div className={`${servicesOpen ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-600'}`}>
                                                    {item.icon}
                                                </div>
                                                <span className="font-bold tracking-tight">{item.name}</span>
                                            </div>
                                            {servicesOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-30" />}
                                        </button>

                                        {servicesOpen && (
                                            <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-1">
                                                {item.subItems.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        onClick={() => closeSidebar()}
                                                        className={`px-4 py-3 rounded-xl transition-all flex items-center gap-3 text-sm ${
                                                            isActive(subItem.href) 
                                                                ? 'bg-primary-50 text-primary-600 font-black' 
                                                                : 'text-slate-500 hover:text-slate-900'
                                                        }`}
                                                    >
                                                        <span className="font-bold tracking-tight">{subItem.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        href={item.href}
                                        onClick={() => closeSidebar()}
                                        className={`px-4 py-3.5 rounded-2xl transition-all flex items-center gap-3.5 text-sm group ${
                                            isActive(item.href)
                                                ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-100'
                                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className={`${isActive(item.href) ? 'text-primary-600' : 'text-slate-400 group-hover:text-primary-600'}`}>
                                            {item.icon}
                                        </div>
                                        <span className={`tracking-tight ${isActive(item.href) ? 'font-black' : 'font-bold'}`}>{item.name}</span>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
}
