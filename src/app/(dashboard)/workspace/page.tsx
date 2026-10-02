"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Buildings, Crown, FolderSimple, PencilSimple, Plus, Trash, UserPlus, UsersThree } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { resetApiStores } from "@/stores/reset-api-stores";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Workspace = { id: string; name: string; slug: string; status: string; role: string; membersCount: number; projectsCount: number; isActive: boolean };
type Member = { id: string; userId: string; name: string; email: string; role: string; status: string; joinedAt: string };
type Invitation = { id: string; email: string; workspaceRole: string; expiresAt: string };

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<"create" | "edit" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiFetch("/api/workspaces", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) toast.error(body.message || "Failed to load workspaces");
    else { setWorkspaces(body.data || []); setSelectedId((current) => body.data?.some((item: Workspace) => item.id === current) ? current : body.data?.[0]?.id || ""); }
    setLoading(false);
  }, []);

  const loadDetails = useCallback(async (workspaceId: string) => {
    if (!workspaceId) { setMembers([]); setInvitations([]); return; }
    const detail = await apiFetch(`/api/workspaces/${workspaceId}`, { cache: "no-store" });
    const detailBody = await detail.json();
    if (detail.ok) setMembers(detailBody.data.members || []);
    const invites = await apiFetch(`/api/workspaces/${workspaceId}/invitations`, { cache: "no-store" });
    if (invites.ok) setInvitations((await invites.json()).data || []); else setInvitations([]);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadDetails(selectedId); }, [selectedId, loadDetails]);
  const selected = workspaces.find((workspace) => workspace.id === selectedId);
  const canManage = !!selected && ["owner", "admin"].includes(selected.role);

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    const response = await apiFetch(drawer === "create" ? "/api/workspaces" : `/api/workspaces/${selectedId}`, { method: drawer === "create" ? "POST" : "PATCH", body: JSON.stringify({ name }) });
    const body = await response.json(); setSaving(false);
    if (!response.ok) return toast.error(body.message || "Failed to save workspace");
    toast.success(body.message || "Workspace saved"); setDrawer(null); await load();
    if (drawer === "create" && body.data?.id) setSelectedId(body.data.id);
  };
  const updateMemberRole = async (memberId: string, role: string) => {
    const response = await apiFetch(`/api/workspaces/${selectedId}/members/${memberId}`, { method: "PATCH", body: JSON.stringify({ role }) }); const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to update workspace role"); toast.success("Workspace role updated"); await Promise.all([loadDetails(selectedId), load()]);
  };
  const removeMember = async (member: Member) => {
    const response = await apiFetch(`/api/workspaces/${selectedId}/members/${member.id}`, { method: "DELETE" }); const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to remove workspace member"); toast.success("Workspace member removed"); await Promise.all([loadDetails(selectedId), load()]);
  };
  const transferOwnership = async (member: Member) => {
    const response = await apiFetch(`/api/workspaces/${selectedId}/transfer-ownership`, { method: "POST", body: JSON.stringify({ memberId: member.id }) }); const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to transfer ownership"); toast.success("Workspace ownership transferred"); await Promise.all([loadDetails(selectedId), load()]);
  };
  const activateWorkspace = async () => {
    if (!selected) return;
    const response = await apiFetch(`/api/workspaces/${selected.id}/activate`, { method: "POST" }); const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to change active workspace"); resetApiStores(); toast.success("Active workspace changed"); window.dispatchEvent(new Event("numpux_master_data_updated")); await load();
  };
  const invite = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    const response = await apiFetch(`/api/workspaces/${selectedId}/invitations`, { method: "POST", body: JSON.stringify({ email, role: inviteRole }) }); const body = await response.json(); setSaving(false);
    if (!response.ok) return toast.error(body.message || "Failed to create invitation");
    await navigator.clipboard.writeText(`${window.location.origin}${body.data.acceptPath}`).catch(() => undefined); toast.success("Invitation created and link copied"); setEmail(""); await loadDetails(selectedId);
  };
  const revokeInvitation = async (invitationId: string) => {
    const response = await apiFetch(`/api/workspaces/${selectedId}/invitations/${invitationId}`, { method: "DELETE" }); const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to revoke invitation"); toast.success("Invitation revoked"); await loadDetails(selectedId);
  };
  const deleteWorkspace = async () => {
    const response = await apiFetch(`/api/workspaces/${selectedId}`, { method: "DELETE" }); const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to delete workspace"); resetApiStores(); toast.success("Workspace deleted"); setSelectedId(body.data.activeWorkspaceId || ""); window.dispatchEvent(new Event("numpux_master_data_updated")); await load();
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight">Workspaces</h1><p className="mt-1 text-xs text-muted-foreground">Manage tenant boundaries, projects, invitations, and roles.</p></div><Button onClick={() => { setName(""); setDrawer("create"); }} className="h-9 gap-1.5 text-xs"><Plus size={14} /> New workspace</Button></div>
    {loading ? <div className="grid gap-3 md:grid-cols-3">{[1,2,3].map((item) => <Skeleton key={item} className="h-24 rounded-lg" />)}</div> : <div className="grid gap-3 md:grid-cols-3">{workspaces.map((workspace) => <button key={workspace.id} onClick={() => setSelectedId(workspace.id)} className={`rounded-lg border p-4 text-left ${selectedId === workspace.id ? "border-primary bg-primary/5" : "border-border bg-card"}`}><div className="flex items-center justify-between"><Buildings size={18} className="text-primary" />{workspace.isActive && <span className="text-[10px] font-semibold text-primary">ACTIVE</span>}</div><p className="mt-3 text-sm font-bold">{workspace.name}</p><p className="mt-1 text-[11px] capitalize text-muted-foreground">{workspace.role} · {workspace.projectsCount} projects</p></button>)}</div>}
    {selected && <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5"><div><h2 className="text-sm font-bold">{selected.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">Workspace members and current access</p></div><div className="flex items-center gap-2">{!selected.isActive && <Button variant="outline" size="sm" onClick={() => void activateWorkspace()}>Set active</Button>}{canManage && <Button variant="outline" size="sm" onClick={() => { setName(selected.name); setDrawer("edit"); }}><PencilSimple /> Edit</Button>}{selected.role === "owner" && <ConfirmDialog title="Delete workspace?" description={selected.projectsCount ? "This workspace still contains projects, including trashed projects. Remove them permanently first." : "Members and pending invitations will be permanently deleted. This cannot be undone."} confirmLabel="Delete workspace" onConfirm={deleteWorkspace}><Button variant="destructive" size="sm" disabled={selected.projectsCount > 0}><Trash /> Delete</Button></ConfirmDialog>}</div></div>
      <div className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2"><Stat icon={<UsersThree size={19} />} value={selected.membersCount} label="Active members" /><Stat icon={<FolderSimple size={19} />} value={selected.projectsCount} label="Projects including trash" /></div>
      {canManage && <form onSubmit={invite} className="flex flex-col gap-2 border-b border-border p-4 sm:flex-row"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required className="flex-1" /><Select value={inviteRole} onValueChange={setInviteRole}><SelectTrigger className="sm:w-32"><SelectValue /></SelectTrigger><SelectContent>{selected.role === "owner" && <SelectItem value="admin">Admin</SelectItem>}<SelectItem value="member">Member</SelectItem><SelectItem value="guest">Guest</SelectItem></SelectContent></Select><Button type="submit" disabled={saving}><UserPlus /> Invite</Button></form>}
      <div className="divide-y divide-border">{members.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-xs font-semibold">{member.name}</p><p className="truncate text-[11px] text-muted-foreground">{member.email}</p></div><div className="flex items-center gap-2">{canManage && member.role !== "owner" ? <Select value={member.role} onValueChange={(role) => void updateMemberRole(member.id, role)}><SelectTrigger className="h-8 w-28 text-[10px]"><SelectValue /></SelectTrigger><SelectContent>{selected.role === "owner" && <SelectItem value="admin">Admin</SelectItem>}<SelectItem value="member">Member</SelectItem><SelectItem value="guest">Guest</SelectItem></SelectContent></Select> : <span className="rounded-md border px-2 py-1 text-[10px] font-semibold capitalize">{member.role}</span>}{selected.role === "owner" && member.role !== "owner" && <ConfirmDialog title="Transfer workspace ownership?" description={`Transfer ${selected.name} to ${member.name}? You will become an administrator.`} confirmLabel="Transfer ownership" onConfirm={() => transferOwnership(member)}><button className="rounded-md p-1.5 text-muted-foreground hover:text-amber-600" title="Transfer ownership"><Crown size={14} /></button></ConfirmDialog>}{canManage && member.role !== "owner" && <ConfirmDialog title="Remove workspace member?" description={`Remove ${member.name} from this workspace and its projects?`} confirmLabel="Remove member" onConfirm={() => removeMember(member)}><button className="rounded-md p-1.5 text-muted-foreground hover:text-rose-600" title="Remove member"><Trash size={14} /></button></ConfirmDialog>}</div></div>)}</div>
      {canManage && invitations.length > 0 && <div className="space-y-2 border-t border-border p-4"><p className="text-[11px] font-semibold uppercase text-muted-foreground">Pending invitations</p>{invitations.map((invitation) => <div key={invitation.id} className="flex items-center justify-between rounded-lg border border-dashed p-3 text-xs"><div><p className="font-semibold">{invitation.email}</p><p className="text-[11px] capitalize text-muted-foreground">{invitation.workspaceRole} · expires {new Date(invitation.expiresAt).toLocaleDateString("en-US")}</p></div><ConfirmDialog title="Revoke invitation?" description={`Revoke the invitation for ${invitation.email}?`} confirmLabel="Revoke" onConfirm={() => revokeInvitation(invitation.id)}><button className="rounded-md p-1.5 text-muted-foreground hover:text-rose-600" title="Revoke invitation"><Trash size={14} /></button></ConfirmDialog></div>)}</div>}
    </div>}
    <Sheet open={drawer !== null} onOpenChange={(open) => !open && setDrawer(null)}><SheetContent side="right" className="w-full p-0 sm:max-w-md"><div className="border-b p-6"><SheetHeader><SheetTitle>{drawer === "create" ? "Create workspace" : "Edit workspace"}</SheetTitle><SheetDescription>{drawer === "create" ? "Create an isolated space for a new team." : "Update the workspace profile."}</SheetDescription></SheetHeader></div><form onSubmit={save} className="space-y-5 p-6"><label className="block space-y-2 text-xs font-semibold"><span>Workspace name</span><Input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required /></label><Button type="submit" disabled={saving || name.trim().length < 2} className="w-full">{saving ? "Saving..." : "Save workspace"}</Button></form></SheetContent></Sheet>
  </div>;
}

function Stat({ icon, value, label }: { icon: ReactNode; value: number; label: string }) { return <div className="flex items-center gap-3 rounded-lg border bg-white p-3"><span className="text-primary">{icon}</span><div><p className="text-lg font-bold">{value}</p><p className="text-[11px] text-muted-foreground">{label}</p></div></div>; }