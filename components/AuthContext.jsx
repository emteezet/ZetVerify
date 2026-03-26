"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check initial online status
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            firstName: session.user.user_metadata?.first_name,
            lastName: session.user.user_metadata?.last_name,
          });
        }
      } catch (err) {
        console.warn("[Auth] Initial session fetch failed (likely offline):", err.message);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const signup = useCallback(async (
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
  ) => {
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Artificial delay for better UX animation if it's too fast
      await new Promise(resolve => setTimeout(resolve, 200));

      router.push("/");
      return { success: true };
    } catch (error) {
      setLoggingOut(false);
      return { success: false, error: error.message };
    }
  }, [router]);

  // ============================================================
  // INACTIVITY TIMEOUT LOGIC (Security Enhancement)
  // ============================================================
  const timeoutRef = useRef(null);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        console.log("[Auth] Session expired due to inactivity");
        logout();
      }, INACTIVITY_LIMIT);
    }
  }, [user, logout]);

  useEffect(() => {
    if (user) {
      // Initial timer set
      resetInactivityTimer();

      // Event listeners for activity
      const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
      events.forEach((event) => {
        window.addEventListener(event, resetInactivityTimer);
      });

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        events.forEach((event) => {
          window.removeEventListener(event, resetInactivityTimer);
        });
      };
    }
  }, [user, resetInactivityTimer]);

  const value = {
    user,
    loading,
    isOnline,
    signup,
    login,
    logout,
    loggingOut,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loggingOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-20 h-20 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
            {/* Logo in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="/ZetVerify-logo icon.png" className="w-10 h-10 object-contain animate-pulse" alt="" />
            </div>
          </div>
          <h2 className="mt-8 text-xl font-black tracking-tight text-primary-900 animate-pulse">
            Signing out...
          </h2>
          <p className="mt-2 text-sm font-medium text-primary-500/60 uppercase tracking-widest">
            See you soon
          </p>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
