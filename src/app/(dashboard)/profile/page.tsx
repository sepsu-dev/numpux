"use client";

import { useState, useEffect } from "react";
import { User, Lock, FloppyDisk, SpinnerGap, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setName(json.data.name || "");
            setEmail(json.data.email || "");
            setRole(json.data.role || "user");
          }
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error("Please enter your current password");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("New password must be at least 8 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
    }

    setIsSaving(true);
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.status === "error") {
        toast.error(data.message || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings, name, and security preferences.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-2xs">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User size={16} /> Basic Information
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Your full name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground border border-border rounded-lg cursor-not-allowed"
              />
              <span className="text-[11px] text-muted-foreground">Email address is linked to your account and cannot be changed directly.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Account Status / Role</label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    role === "admin"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {role === "admin" ? "Administrator" : "Standard User"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {role === "admin"
                    ? "Full system administrative privileges."
                    : "Standard workspace member privileges."}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock size={16} /> Change Password
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Re-type new password"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-all hover:bg-primary/90 active:scale-98 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isSaving ? <SpinnerGap size={14} className="animate-spin" /> : <FloppyDisk size={14} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
