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

    // Initial loading state is true by default
    // We rely solely on onAuthStateChange to catch the initial session
    // This avoids the "Lock broken" error caused by competing getSession calls

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Verify status before setting user
        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', session.user.id)
          .single();

        if (profile?.status && profile.status !== 'ACTIVE') {
          console.warn("[Auth] Restricting access for status:", profile.status);
          await supabase.auth.signOut();
          setUser(null);
          setLoading(false);
          return;
        }

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

      if (!firstName || !lastName || firstName.trim() === "" || lastName.trim() === "") {
        throw new Error("First and Last names are required");
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

      // Reset inactivity timer on success
      localStorage.setItem('zetverify_last_activity', Date.now().toString());

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

      // Verify status immediately after login
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status, suspension_reason')
        .eq('id', data.user.id)
        .single();

      if (profile?.status && profile.status !== 'ACTIVE') {
        await supabase.auth.signOut();
        throw new Error(profile.suspension_reason || `Your account is ${profile.status.toLowerCase()}. Please contact support.`);
      }

      // Reset inactivity timer on success
      localStorage.setItem('zetverify_last_activity', Date.now().toString());

      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async (reason = null) => {
    try {
      setLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Artificial delay for better UX animation if it's too fast
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Clear states and navigate
      setLoggingOut(false);
      setUser(null);
      
      const loginUrl = reason ? `/auth/login?reason=${reason}` : "/auth/login";
      router.push(loginUrl);
      
      return { success: true };
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      setLoggingOut(false);
      return { success: false, error: error.message };
    }
  }, [router]);

  const sendResetLink = useCallback(async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  // ============================================================
  // INACTIVITY TIMEOUT LOGIC (Security Enhancement)
  // ============================================================
  const timeoutRef = useRef(null);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      // 1. Update localStorage for cross-tab and PWA background recovery
      localStorage.setItem('zetverify_last_activity', Date.now().toString());

      // 2. Set client-side timeout for active session
      timeoutRef.current = setTimeout(() => {
        console.log("[Auth] Session expired due to inactivity");
        logout('expired');
      }, INACTIVITY_LIMIT);
    }
  }, [user, logout]);

  useEffect(() => {
    if (user) {
      // Initial check on mount/login
      const lastActivity = localStorage.getItem('zetverify_last_activity');
      if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_LIMIT) {
        console.log("[Auth] Session expired while away");
        logout('expired');
        return;
      }

      // Initial timer set
      resetInactivityTimer();

      // Event listeners for activity
      const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove", "click"];
      events.forEach((event) => {
        window.addEventListener(event, resetInactivityTimer);
      });

      // PWA / Mobile Background Handler: Check when user returns to app
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          const last = localStorage.getItem('zetverify_last_activity');
          if (last && Date.now() - parseInt(last) > INACTIVITY_LIMIT) {
            console.log("[Auth] Session expired during backgrounding");
            logout('expired');
          } else {
            resetInactivityTimer(); // Resume timer
          }
        }
      };
      window.addEventListener("visibilitychange", handleVisibilityChange);

      // Periodic check as fallback (every 30 seconds)
      const interval = setInterval(() => {
        const last = localStorage.getItem('zetverify_last_activity');
        if (last && Date.now() - parseInt(last) > INACTIVITY_LIMIT) {
          logout('expired');
        }
      }, 30000);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        clearInterval(interval);
        events.forEach((event) => {
          window.removeEventListener(event, resetInactivityTimer);
        });
        window.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [user, resetInactivityTimer, logout]);

  const value = {
    user,
    loading,
    isOnline,
    signup,
    login,
    logout,
    sendResetLink,
    updatePassword,
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
