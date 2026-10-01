"use client";

import { useState, useEffect } from "react";
import { User, Lock, FloppyDisk, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"superadmin" | "admin" | "user">("user");
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

      toast.success("Profile updated");
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your account details and password.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 shadow-none">
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User size={16} /> Account details
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Full name</label>
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
              <label className="text-xs font-medium text-foreground">Email address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 text-sm bg-muted text-muted-foreground border border-border rounded-lg cursor-not-allowed"
              />
              <span className="text-[11px] text-muted-foreground">Email address is linked to your account and cannot be changed directly.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Role</label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    role === "superadmin"
                      ? "border-violet-500/20 bg-violet-500/10 text-violet-600"
                      : role === "admin"
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  }`}
                >
                  {role === "superadmin" ? "Super Administrator" : role === "admin" ? "Administrator" : "Standard User"}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {role === "superadmin"
                    ? "Unrestricted access to system configuration and all menus."
                    : role === "admin"
                    ? "Full system administrative privileges."
                      : "Access is based on your assigned workspace role."}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Lock size={16} /> Change password
            </h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Current password</label>
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
                <label className="text-xs font-medium text-foreground">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Confirm new password</label>
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer shadow-none"
            >
              {isSaving ? <SpinnerGap size={14} className="animate-spin" /> : <FloppyDisk size={14} />}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
