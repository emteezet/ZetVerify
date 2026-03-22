"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
      return { success: true };
    } catch (error) {
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
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
