"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Trash, Shield, Crown, Eye, User as UserIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { Project, ProjectMember, ProjectMemberRole } from "@/lib/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
}

const ROLES: { id: ProjectMemberRole; label: string; desc: string; icon: any }[] = [
    { id: "Admin", label: "Admin", desc: "Can manage tasks, members, and settings", icon: Shield },
    { id: "Member", label: "Member", desc: "Can create and edit tasks", icon: UserIcon },
    { id: "Viewer", label: "Viewer", desc: "Read-only access to the project", icon: Eye },
];

export function ProjectMembersModal({ open, onOpenChange, project }: ProjectMembersModalProps) {
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<ProjectMemberRole>("Member");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchMembers = async () => {
        if (!project) return;
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/projects/${project.id}/members`);
            const data = await res.json();
            if (data.data) {
                setMembers(data.data);
            }
        } catch {
            toast.error("Failed to load members");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && project) {
            fetchMembers();
            setEmail("");
            setRole("Member");
        }
    }, [open, project]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !email.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await apiFetch(`/api/projects/${project.id}/members`, {
                method: "POST",
                body: JSON.stringify({ email: email.trim(), role }),
            });
            const data = await res.json();

            if (!res.ok || data.status === "error") {
                toast.error(data.message || "Failed to invite member");
            } else {
                toast.success(data.message || "Member invited successfully!");
                setEmail("");
                fetchMembers();
            }
        } catch {
            toast.error("An error occurred while inviting member.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (member: ProjectMember) => {
        if (!project) return;
        try {
            const res = await apiFetch(`/api/projects/${project.id}/members/${member.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Removed ${member.name} from project.`);
                setMembers((prev) => prev.filter((m) => m.id !== member.id));
            } else {
                toast.error(data.message || "Failed to remove member");
            }
        } catch {
            toast.error("Failed to remove member");
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border/60">
                        <SheetHeader className="p-0">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                    <Users size={16} weight="bold" />
                                </div>
                                <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                    Project Members
                                </SheetTitle>
                            </div>
                            <SheetDescription className="text-xs text-muted-foreground">
                                Manage collaborators and access permissions for <span className="font-semibold text-foreground">{project?.title}</span>.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                        {/* Invite Form */}
                        <form onSubmit={handleInvite} className="space-y-2">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Invite by Email
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10 text-xs rounded-xl bg-background/50 border-border focus:border-primary flex-1 font-medium"
                                    required
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting || !email.trim()}
                                    className="h-10 px-4 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer shadow-xs"
                                >
                                    <UserPlus size={14} className="mr-1 stroke-[2.5]" />
                                    Invite
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Enter any collaborator's email. They will instantly be added to this project.
                            </p>
                        </form>

                        {/* Member List */}
                        <div className="space-y-3 pt-3 border-t border-border/60">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Active Members ({members.length})
                            </div>

                            {isLoading ? (
                                <div className="space-y-2.5">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            ) : members.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-xl">
                                    No collaborators yet. Invite someone above!
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60 group hover:border-border transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {/* Avatar */}
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                                    {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">
                                                        {member.name}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                        {member.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {member.role === "Owner" ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                        <Crown size={12} weight="fill" />
                                                        Owner
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                                        {member.role}
                                                    </span>
                                                )}

                                                {member.role !== "Owner" && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemove(member)}
                                                        className="text-muted-foreground hover:text-rose-600 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                                                        title={`Remove ${member.name}`}
                                                    >
                                                        <Trash size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
