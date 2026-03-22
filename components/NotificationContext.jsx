"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, type = "info") => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed z-[9999] flex flex-col gap-3 w-[calc(100%-2rem)] md:w-96 
                bottom-6 left-1/2 -translate-x-1/2 
                md:top-6 md:bottom-auto md:right-6 md:left-auto md:translate-x-0">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-right-10 duration-300 ${n.type === "error"
                            ? "bg-red-50/90 border-red-200 text-red-800"
                            : n.type === "success"
                                ? "bg-emerald-50/90 border-emerald-200 text-emerald-800"
                                : "bg-blue-50/90 border-blue-200 text-blue-800"
                            }`}
                    >
                        <div className="mt-0.5">
                            {n.type === "error" ? (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : n.type === "success" ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                                <Info className="w-5 h-5 text-blue-500" />
                            )}
                        </div>
                        <p className="text-sm font-semibold flex-1">{n.message}</p>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 opacity-50" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export const useNotification = () => useContext(NotificationContext);
