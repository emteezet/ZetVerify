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
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const router = useRouter();
  const inactivityIntervalRef = useRef(null);
  const isAuthActionInProgress = useRef(false);
  // Ref mirror of loggingOut — avoids stale closures in useCallback deps.
  const loggingOutRef = useRef(false);
  // True when the app is mounted on the password-reset page (set once on mount).
  // Used to skip account-status checks during the reset flow.
  const isOnResetPageRef = useRef(false);
  // Tracks when the tab was last hidden — used to calculate elapsed time on restore.
  const hiddenAtRef = useRef(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(window.navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Capture whether we are on the reset-password page at mount time (before the
    // hash is cleared). This lets us treat any SIGNED_IN event on that page as a
    // recovery event and skip the account-status check.
    isOnResetPageRef.current =
      window.location.pathname.includes('/auth/reset-password') ||
      window.location.hash.includes('type=recovery');

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // An event is a recovery if Supabase says so OR if we're on the reset page
        const isRecovery = event === 'PASSWORD_RECOVERY' || isOnResetPageRef.current;
        if (isRecovery) {
          setIsRecoverySession(true);
        }

        // Skip profile fetch if an explicit auth action is already handling state,
        // if it's just a user update (handled locally), or during a recovery session.
        const shouldFetchProfile =
          (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || !user) &&
          !isAuthActionInProgress.current &&
          !isRecovery;

        if (shouldFetchProfile) {
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
    if (loggingOutRef.current) return { success: true };
    
    try {
      loggingOutRef.current = true;
      setLoggingOut(true);
      
      // Stop further inactivity checks immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (inactivityIntervalRef.current) {
        clearInterval(inactivityIntervalRef.current);
        inactivityIntervalRef.current = null;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // CRITICAL FIX: Remove the stale timestamp BEFORE the hard redirect.
      localStorage.removeItem('zetverify_last_activity');

      // Artificial delay for better UX animation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear states
      setUser(null);
      
      // Use hard redirect to ensure all application state is wiped
      const loginUrl = reason ? `/auth/login?reason=${reason}` : "/auth/login";
      window.location.href = loginUrl;
      
      return { success: true };
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
      loggingOutRef.current = false;
      setLoggingOut(false);
      return { success: false, error: error.message };
    }
  }, []);

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
      isAuthActionInProgress.current = true;

      // Small buffer to let any pending storage locks settle
      await new Promise(r => setTimeout(r, 100));

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        return {
          success: false,
          error: "Your password reset link has expired or is invalid. Please request a new one.",
        };
      }

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.first_name,
          lastName: data.user.user_metadata?.last_name,
        });
        return { success: true };
      }

      if (error) {
        const isLockError =
          error.name === 'AbortError' ||
          error.message?.toLowerCase().includes('lock broken') ||
          error.message?.toLowerCase().includes('steal');

        if (isLockError) {
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("[Auth] Update password failed:", error);
      return { success: false, error: error.message };
    } finally {
      setTimeout(() => {
        isAuthActionInProgress.current = false;
      }, 500);
    }
  }, []);

  const timeoutRef = useRef(null);
  const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

  /**
   * Lightweight expiry redirect — NO overlay, NO async, NO React state.
   * Used for all automated/background session expiry scenarios to avoid
   * the overlay-freeze bug caused by browser tab throttling.
   */
  const silentExpiredRedirect = useCallback(() => {
    if (loggingOutRef.current) return; // prevent double-fire
    localStorage.removeItem('zetverify_last_activity');
    window.location.href = '/auth/login?reason=expired';
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      localStorage.setItem('zetverify_last_activity', Date.now().toString());
      timeoutRef.current = setTimeout(() => {
        // Only redirect if the tab is still visible.
        // If hidden, the visibilitychange handler will catch it when restored.
        if (document.visibilityState === 'visible') {
          silentExpiredRedirect();
        }
      }, INACTIVITY_LIMIT);
    }
  }, [user, silentExpiredRedirect]);

  useEffect(() => {
    if (user) {
      // ── MOUNT CHECK ─────────────────────────────────────────────────────
      // If the stored timestamp is stale on mount, redirect silently.
      // Do NOT call logout() here — it would show the overlay before
      // the page is even interactive.
      const lastActivity = localStorage.getItem('zetverify_last_activity');
      if (lastActivity && Date.now() - parseInt(lastActivity) > INACTIVITY_LIMIT) {
        silentExpiredRedirect();
        return;
      }

      resetInactivityTimer();

      const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove", "click"];
      events.forEach((event) => {
        window.addEventListener(event, resetInactivityTimer);
      });

      // ── VISIBILITY HANDLER ───────────────────────────────────────────────
      // This is the core fix:
      // - On HIDDEN: pause the interval to stop background firing.
      // - On VISIBLE: use Supabase as the authoritative source of truth
      //   (fixes cross-device false logouts), THEN check localStorage.
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'hidden') {
          // Tab going background — pause interval, record time.
          hiddenAtRef.current = Date.now();
          if (inactivityIntervalRef.current) {
            clearInterval(inactivityIntervalRef.current);
            inactivityIntervalRef.current = null;
          }
        } else if (document.visibilityState === 'visible') {
          // Tab restored — verify Supabase session FIRST.
          // This is the cross-device fix: if the user logged out on another
          // device or the server revoked the session, getSession() will return
          // null here, regardless of what localStorage timestamp says.
          try {
            const { data } = await supabase.auth.getSession();
            if (!data?.session) {
              silentExpiredRedirect();
              return;
            }
          } catch {
            // Network error — fall through to localStorage check below.
          }

          // Supabase session is valid. Now check local inactivity timestamp.
          const last = localStorage.getItem('zetverify_last_activity');
          if (last && Date.now() - parseInt(last) > INACTIVITY_LIMIT) {
            silentExpiredRedirect();
            return;
          }

          // All good — restart timer and resume the interval.
          resetInactivityTimer();
          if (!inactivityIntervalRef.current) {
            inactivityIntervalRef.current = setInterval(() => {
              if (document.visibilityState === 'visible') {
                const l = localStorage.getItem('zetverify_last_activity');
                if (l && Date.now() - parseInt(l) > INACTIVITY_LIMIT) {
                  silentExpiredRedirect();
                }
              }
            }, 10000);
          }
        }
      };
      window.addEventListener("visibilitychange", handleVisibilityChange);

      // ── INITIAL INTERVAL ─────────────────────────────────────────────────
      // Guarded to only fire when the tab is visible. If it fires while
      // hidden it would show an overlay on a backgrounded/throttled tab.
      inactivityIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          const last = localStorage.getItem('zetverify_last_activity');
          if (last && Date.now() - parseInt(last) > INACTIVITY_LIMIT) {
            silentExpiredRedirect();
          }
        }
      }, 10000);

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (inactivityIntervalRef.current) {
          clearInterval(inactivityIntervalRef.current);
          inactivityIntervalRef.current = null;
        }
        events.forEach((event) => {
          window.removeEventListener(event, resetInactivityTimer);
        });
        window.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [user, resetInactivityTimer, silentExpiredRedirect]);

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
    isRecoverySession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {loggingOut && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-primary-100 border-t-primary-600 animate-spin" />
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
