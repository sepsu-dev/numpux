"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, EnvelopeSimple, Buildings, Key, ShieldCheck } from "@phosphor-icons/react";
import { apiFetch } from "@/lib/api-client";

interface ProfileModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentUser: { name: string; email: string };
    onUserUpdated: (user: { name: string; email: string }) => void;
}

export function ProfileModal({
    open,
    onOpenChange,
    currentUser,
    onUserUpdated,
}: ProfileModalProps) {
    const [name, setName] = useState(currentUser.name);
    const [organization, setOrganization] = useState("Numpux Workspace");
    const [isSaving, setIsSaving] = useState(false);

    // Password change fields
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (open) {
            setName(currentUser.name);
            setShowPasswordChange(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
    }, [open, currentUser]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Full name cannot be empty");
            return;
        }

        if (showPasswordChange) {
            if (!currentPassword) {
                toast.error("Please enter your current password");
                return;
            }
            if (newPassword.length < 6) {
                toast.error("New password must be at least 6 characters long");
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error("New password confirmation does not match");
                return;
            }
        }

        setIsSaving(true);
        try {
            const payload: any = { name: name.trim() };
            if (showPasswordChange) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            const res = await apiFetch("/api/auth/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");
            onUserUpdated({ name: name.trim(), email: currentUser.email });
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "An error occurred while saving profile");
        } finally {
            setIsSaving(false);
        }
    };

    const initials = (name || currentUser.name || "U")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
                <form onSubmit={handleSave} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border/60">
                        <SheetHeader className="p-0">
                            <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                User Profile
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                Manage personal profile details, organization role, and security.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                        {/* Profile Avatar Card */}
                        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-muted/40 border border-border/70">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0 border border-primary/20">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-xs text-foreground truncate">{currentUser.name}</h4>
                                <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                                        Workspace Admin
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* General Info */}
                        <div className="space-y-3.5">
                            <div className="space-y-1.5">
                                <Label htmlFor="profile-name" className="text-xs font-semibold text-foreground">
                                    Full Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={13} />
                                    <Input
                                        id="profile-name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-10 text-xs rounded-xl pl-9 bg-background/50 border-border focus:border-primary font-medium shadow-2xs"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="profile-email" className="text-xs font-semibold text-foreground">
                                    Email Address
                                </Label>
                                <div className="relative">
                                    <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={13} />
                                    <Input
                                        id="profile-email"
                                        value={currentUser.email}
                                        disabled
                                        className="h-10 text-xs rounded-xl pl-9 bg-muted/40 border-border/60 text-muted-foreground font-medium shadow-none cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="profile-org" className="text-xs font-semibold text-foreground">
                                    Organization / Workspace
                                </Label>
                                <div className="relative">
                                    <Buildings className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={13} />
                                    <Input
                                        id="profile-org"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        className="h-10 text-xs rounded-xl pl-9 bg-background/50 border-border focus:border-primary font-medium shadow-2xs"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security / Password section */}
                        <div className="pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-foreground">Account Security</p>
                                    <p className="text-[11px] text-muted-foreground">Change your account password</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                >
                                    {showPasswordChange ? "Hide" : "Change Password"}
                                </button>
                            </div>

                            {showPasswordChange && (
                                <div className="mt-3.5 space-y-3 p-3.5 rounded-xl border border-border/70 bg-background/40">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-foreground">Current Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={13} />
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="h-9 text-xs rounded-lg pl-9 bg-card border-border"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-foreground">New Password</Label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={13} />
                                            <Input
                                                type="password"
                                                placeholder="At least 6 characters"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="h-9 text-xs rounded-lg pl-9 bg-card border-border"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-foreground">Confirm New Password</Label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={13} />
                                            <Input
                                                type="password"
                                                placeholder="Re-enter new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="h-9 text-xs rounded-lg pl-9 bg-card border-border"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSaving}
                            className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs"
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
