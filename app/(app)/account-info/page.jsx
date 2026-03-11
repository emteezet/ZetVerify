"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { useNotification } from "@/components/NotificationContext";
import {
  LayoutDashboard, User, Mail, ShieldCheck,
  Lock, CheckCircle2, Loader2, LogOut, Pencil, X
} from "lucide-react";

export default function AccountInfoPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { showNotification } = useNotification();

  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "" });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="spinner text-accent-green! w-10! h-10! border-4" />
      </div>
    );
  }

  if (!user) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
      },
    });
    setSaving(false);
    if (error) {
      showNotification("Failed to update profile: " + error.message, "error");
    } else {
      showNotification("Profile updated successfully!", "success");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
    });
    setIsEditing(false);
  };

  const handlePasswordReset = async () => {
    setPasswordLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setPasswordLoading(false);
    if (error) {
      showNotification("Failed to send reset email: " + error.message, "error");
    } else {
      showNotification("Password reset email sent! Check your inbox.", "success");
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-bg-secondary/30 pb-20">
      {/* Hero Header */}
      <div className="gradient-hero pt-24 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-3">
            <LayoutDashboard className="w-4 h-4" />
            <span>Identity Portal / Account</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Account Settings
          </h1>
          <p className="text-white/70 text-lg">
            Manage your profile and security preferences.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 -mt-16 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left: Profile Form */}
          <div className="lg:col-span-8 space-y-6">
            {/* Profile Card */}
            <div className="glass-card p-8">
              <h2 className="font-bold text-text-primary flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-accent-green" />
                Profile Information
              </h2>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Email (read-only) */}
                <div>
                  <label className="text-sm font-semibold text-text-secondary block mb-2">
                    Email Address
                  </label>
                  <div className="input-field flex items-center gap-2 opacity-60 cursor-not-allowed">
                    <Mail className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="text-text-primary text-sm">{user.email}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Email address cannot be changed.</p>
                </div>

                {/* First Name */}
                <div>
                  <label className="text-sm font-semibold text-text-secondary block mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(p => ({ ...p, firstName: e.target.value }))}
                    className={`input-field w-full transition-opacity ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="Enter first name"
                    disabled={!isEditing}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-sm font-semibold text-text-secondary block mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(p => ({ ...p, lastName: e.target.value }))}
                    className={`input-field w-full transition-opacity ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="Enter last name"
                    disabled={!isEditing}
                  />
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center gap-2 px-6 py-2.5"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-2.5"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Right: Security + Account Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Account Summary */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-accent-green" />
                Account Summary
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase font-bold text-text-muted tracking-wide">Name</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.lastName || "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-text-muted tracking-wide">Email</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5 break-all">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-text-muted tracking-wide">Account ID</p>
                  <p className="text-[11px] font-mono text-text-muted mt-0.5 break-all">{user.id}</p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="glass-card p-6">
              <h3 className="font-bold text-text-primary flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-accent-green" />
                Security
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handlePasswordReset}
                  disabled={passwordLoading}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between group"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                >
                  <span>Change Password</span>
                  {passwordLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <span className="text-xs text-accent-green opacity-0 group-hover:opacity-100 transition-opacity">Send Reset Email →</span>
                  }
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626" }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
