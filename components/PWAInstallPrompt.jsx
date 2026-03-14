"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed/running in standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iPhone|iPad|iPod/.test(window.navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Capture the beforeinstallprompt event (Android/Chrome/Edge)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show after a small delay to not annoy the user immediately
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If it's iOS and not already installed, show the custom iOS hint
    if (ios && !isStandaloneMode) {
        const lastPrompted = localStorage.getItem('ios-pwa-prompt-last');
        const now = Date.now();
        // Show once every 24 hours
        if (!lastPrompted || (now - parseInt(lastPrompted) > 86400000)) {
            setTimeout(() => setShowPrompt(true), 5000);
        }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const closePrompt = () => {
    setShowPrompt(false);
    if (isIOS) {
        localStorage.setItem('ios-pwa-prompt-last', Date.now().toString());
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-10 fade-in duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 flex flex-col gap-4 max-w-sm mx-auto overflow-hidden relative">
        <button 
          onClick={closePrompt}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-green flex items-center justify-center shadow-inner overflow-hidden">
            <img src="/icon-192x192.png" alt="App Icon" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-sm">NIN-Platform</h4>
            <p className="text-xs text-slate-500 leading-tight">Install on your home screen for a faster experience.</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-3">
              1. Tap the Share button <Share className="w-4 h-4 text-blue-500" />
            </p>
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-3">
              2. Scroll down and tap <PlusSquare className="w-4 h-4" /> "Add to Home Screen"
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-sm shadow-xl"
          >
            <Download className="w-5 h-5 text-white" />
            Install Application
          </button>
        )}
      </div>
    </div>
  );
}
