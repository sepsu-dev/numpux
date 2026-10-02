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
import { Users, UserPlus, Trash, Crown } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { Project, ProjectMember, ProjectMemberRole } from "@/types";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ProjectMembersModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project | null;
}

export function ProjectMembersModal({ open, onOpenChange, project }: ProjectMembersModalProps) {
    const canManage = ["owner", "admin"].includes((project?.userRole || "").toLowerCase());
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [invitations, setInvitations] = useState<Array<{ id: string; email: string; projectRole: string; status: string; expiresAt: string }>>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<ProjectMemberRole>("contributor");
    const [roles, setRoles] = useState<Array<{ name: string; displayName: string }>>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchMembers = async () => {
        if (!project) return;
        setIsLoading(true);
        try {
            const res = await apiFetch(`/api/projects/${project.id}/members`);
            const data = await res.json();
            if (data.data) {
                setMembers(data.data.members || []);
                setInvitations(data.data.invitations || []);
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
            setRole("contributor");
            apiFetch("/api/privileges?mode=project-groups").then((res) => res.json()).then((body) => setRoles(body.data || [])).catch(() => setRoles([]));
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
                const link = data.data?.acceptPath ? `${window.location.origin}${data.data.acceptPath}` : "";
                if (link) await navigator.clipboard.writeText(link).catch(() => undefined);
                toast.success(link ? "Invitation created and link copied" : (data.message || "Invitation created"));
                setEmail("");
                fetchMembers();
            }
        } catch {
            toast.error("An error occurred while inviting member.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevokeInvitation = async (invitationId: string) => {
        if (!project) return;
        const response = await apiFetch(`/api/projects/${project.id}/invitations/${invitationId}`, { method: "DELETE" });
        const body = await response.json();
        if (!response.ok) return toast.error(body.message || "Failed to revoke invitation");
        toast.success("Invitation revoked");
        setInvitations((current) => current.filter((item) => item.id !== invitationId));
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

    const handleRoleChange = async (member: ProjectMember, nextRole: string) => {
        if (!project) return;
        const res = await apiFetch(`/api/projects/${project.id}/members/${member.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: nextRole }) });
        const body = await res.json();
        if (!res.ok) return toast.error(body.message || "Failed to update member role");
        toast.success("Member role updated");
        await fetchMembers();
    };

    const handleTransferOwnership = async (member: ProjectMember) => {
        if (!project) return;
        const res = await apiFetch(`/api/projects/${project.id}/members/${member.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "transfer_ownership" }) });
        const body = await res.json();
        if (!res.ok) return toast.error(body.message || "Failed to transfer ownership");
        toast.success("Project ownership transferred");
        await fetchMembers();
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-md w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-none">
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
                                Manage members and access for <span className="font-semibold text-foreground">{project?.title}</span>.
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
                        {/* Invite Form */}
                        {canManage && <form onSubmit={handleInvite} className="space-y-2">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Invite by Email
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10 text-xs rounded-lg bg-white border-border focus:border-primary flex-1 font-medium"
                                    required
                                />
                                <Select value={role} onValueChange={(value) => setRole(value as ProjectMemberRole)}>
                                    <SelectTrigger className="h-10 w-32 text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
                                    <SelectContent>{roles.filter((item) => item.name.toLowerCase() !== "owner").map((item) => <SelectItem key={item.name} value={item.name}>{item.displayName || item.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSubmitting || !email.trim()}
                                    className="h-10 px-4 rounded-lg text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-colors shrink-0 cursor-pointer shadow-none"
                                >
                                    <UserPlus size={14} className="mr-1 stroke-[2.5]" />
                                    Invite
                                </Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                The recipient must accept the invitation before access is granted.
                            </p>
                        </form>}

                        {/* Member List */}
                        <div className="space-y-3 pt-3 border-t border-border/60">
                            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                Active Members ({members.length})
                            </div>

                            {isLoading ? (
                                <div className="space-y-2.5">
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                    <Skeleton className="h-12 w-full rounded-lg" />
                                </div>
                            ) : members.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 border border-dashed border-border rounded-lg">
                                    No project members yet.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/60 group hover:border-border transition-colors text-xs"
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
                                                {member.role.toLowerCase() === "owner" ? (
                                                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                        <Crown size={12} weight="fill" />
                                                        Owner
                                                    </span>
                                                ) : canManage ? (
                                                    <Select value={member.role.toLowerCase()} onValueChange={(value) => void handleRoleChange(member, value)}>
                                                        <SelectTrigger className="h-7 w-28 text-[10px]"><SelectValue /></SelectTrigger>
                                                        <SelectContent>{roles.filter((item) => item.name.toLowerCase() !== "owner").map((item) => <SelectItem key={item.name} value={item.name}>{item.displayName || item.name}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] font-semibold capitalize">{member.role}</span>}

                                                {canManage && member.role.toLowerCase() !== "owner" && (
                                                    <>{project?.userRole?.toLowerCase() === "owner" && <ConfirmDialog title="Transfer project ownership?" description={`Transfer ${project.title} to ${member.name}?`} confirmLabel="Transfer ownership" onConfirm={() => handleTransferOwnership(member)}><button type="button" className="rounded-md p-1 text-muted-foreground opacity-60 transition-colors hover:text-amber-600 group-hover:opacity-100" title={`Transfer ownership to ${member.name}`}><Crown size={14} /></button></ConfirmDialog>}<button
                                                        type="button"
                                                        onClick={() => handleRemove(member)}
                                                        className="text-muted-foreground hover:text-rose-600 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-colors cursor-pointer"
                                                        title={`Remove ${member.name}`}
                                                    >
                                                        <Trash size={14} />
                                                    </button></>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {canManage && invitations.length > 0 && <div className="space-y-3 border-t border-border/60 pt-4">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Invitations ({invitations.length})</div>
                            <div className="space-y-2">{invitations.map((invitation) => <div key={invitation.id} className="flex items-center justify-between rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs">
                                <div className="min-w-0"><p className="truncate font-semibold">{invitation.email}</p><p className="mt-0.5 text-[11px] capitalize text-muted-foreground">{invitation.projectRole} · expires {new Date(invitation.expiresAt).toLocaleDateString("en-US")}</p></div>
                                <button type="button" onClick={() => void handleRevokeInvitation(invitation.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" title="Revoke invitation"><Trash size={14} /></button>
                            </div>)}</div>
                        </div>}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-lg text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-colors cursor-pointer shadow-none"
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
