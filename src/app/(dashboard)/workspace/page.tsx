"use client";

import { useCallback, useEffect, useState } from "react";
import { Buildings, Crown, FolderSimple, PencilSimple, Plus, Trash, UsersThree } from "@phosphor-icons/react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Workspace = { id: string; name: string; slug: string; status: string; role: string; membersCount: number; projectsCount: number; isActive: boolean };
type Member = { id: string; userId: string; name: string; email: string; role: string; status: string; joinedAt: string };

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState<"create" | "edit" | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiFetch("/api/workspaces", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) toast.error(body.message || "Failed to load workspaces");
    else {
      setWorkspaces(body.data || []);
      setSelectedId((current) => current || body.data?.[0]?.id || "");
    }
    setLoading(false);
  }, []);

  const loadMembers = useCallback(async (workspaceId: string) => {
    if (!workspaceId) return setMembers([]);
    const response = await apiFetch(`/api/workspaces/${workspaceId}`, { cache: "no-store" });
    const body = await response.json();
    if (response.ok) setMembers(body.data.members || []);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void loadMembers(selectedId); }, [selectedId, loadMembers]);

  const selected = workspaces.find((workspace) => workspace.id === selectedId);
  const canManage = selected && ["owner", "admin"].includes(selected.role);

  const openCreate = () => { setName(""); setDrawer("create"); };
  const openEdit = () => { if (!selected) return; setName(selected.name); setDrawer("edit"); };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await apiFetch(drawer === "create" ? "/api/workspaces" : `/api/workspaces/${selectedId}`, {
      method: drawer === "create" ? "POST" : "PATCH",
      body: JSON.stringify({ name }),
    });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return toast.error(body.message || "Failed to save workspace");
    toast.success(body.message || "Workspace saved");
    setDrawer(null);
    await load();
    if (drawer === "create" && body.data?.id) setSelectedId(body.data.id);
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    const response = await apiFetch(`/api/workspaces/${selectedId}/members/${memberId}`, { method: "PATCH", body: JSON.stringify({ role }) });
    const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to update workspace role");
    toast.success("Workspace role updated");
    await loadMembers(selectedId);
    await load();
  };

  const removeMember = async (member: Member) => {
    if (!confirm(`Remove ${member.name} from this workspace and its projects?`)) return;
    const response = await apiFetch(`/api/workspaces/${selectedId}/members/${member.id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to remove workspace member");
    toast.success("Workspace member removed");
    await loadMembers(selectedId);
    await load();
  };

  const transferOwnership = async (member: Member) => {
    if (!confirm(`Transfer ownership of ${selected?.name} to ${member.name}? You will become an administrator.`)) return;
    const response = await apiFetch(`/api/workspaces/${selectedId}/transfer-ownership`, { method: "POST", body: JSON.stringify({ memberId: member.id }) });
    const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to transfer ownership");
    toast.success("Workspace ownership transferred");
    await load();
    await loadMembers(selectedId);
  };

  const activateWorkspace = async () => {
    if (!selected) return;
    const response = await apiFetch(`/api/workspaces/${selected.id}/activate`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) return toast.error(body.message || "Failed to change active workspace");
    toast.success("Active workspace changed");
    window.dispatchEvent(new Event("numpux_master_data_updated"));
    await load();
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold tracking-tight">Workspace</h1><p className="mt-1 text-xs text-muted-foreground">Manage tenant boundaries, projects, and membership roles.</p></div>
      <Button onClick={openCreate} className="h-9 gap-1.5 text-xs"><Plus size={14} /> New workspace</Button>
    </div>

    {loading ? <div className="grid gap-3 md:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}</div> :
      <div className="grid gap-3 md:grid-cols-3">{workspaces.map((workspace) => <button key={workspace.id} onClick={() => setSelectedId(workspace.id)} className={`rounded-xl border p-4 text-left transition-colors ${selectedId === workspace.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/30"}`}>
        <div className="flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Buildings size={18} /></span><div className="flex items-center gap-1.5">{workspace.isActive && <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Active</span>}<span className="rounded-md border border-border bg-white px-2 py-1 text-[10px] font-semibold capitalize">{workspace.role}</span></div></div>
        <p className="mt-3 truncate text-sm font-bold">{workspace.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{workspace.membersCount} members · {workspace.projectsCount} projects</p>
      </button>)}</div>}

    {selected && <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="text-sm font-bold">{selected.name}</h2><p className="mt-1 text-[11px] text-muted-foreground">Workspace members and their current roles</p></div><div className="flex items-center gap-2">{!selected.isActive && <Button variant="outline" size="sm" onClick={() => void activateWorkspace()} className="text-xs">Set active</Button>}{canManage && <Button variant="outline" size="sm" onClick={openEdit} className="gap-1.5 text-xs"><PencilSimple size={13} /> Edit</Button>}</div></div>
      <div className="grid gap-3 border-b border-border bg-muted/20 p-4 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"><UsersThree size={19} className="text-primary" /><div><p className="text-lg font-bold">{selected.membersCount}</p><p className="text-[11px] text-muted-foreground">Active members</p></div></div><div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"><FolderSimple size={19} className="text-primary" /><div><p className="text-lg font-bold">{selected.projectsCount}</p><p className="text-[11px] text-muted-foreground">Active projects</p></div></div></div>
      <div className="divide-y divide-border">{members.map((member) => <div key={member.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{member.name.slice(0, 1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-xs font-semibold">{member.name}</p><p className="truncate text-[11px] text-muted-foreground">{member.email}</p></div></div><div className="flex items-center gap-2">{canManage && member.role !== "owner" ? <Select value={member.role} onValueChange={(role) => void updateMemberRole(member.id, role)}><SelectTrigger className="h-8 w-28 text-[10px]"><SelectValue /></SelectTrigger><SelectContent>{selected.role === "owner" && <SelectItem value="admin">Admin</SelectItem>}<SelectItem value="member">Member</SelectItem><SelectItem value="guest">Guest</SelectItem></SelectContent></Select> : <span className="rounded-md border border-border bg-muted/30 px-2 py-1 text-[10px] font-semibold capitalize">{member.role}</span>}{selected.role === "owner" && member.role !== "owner" && <button type="button" onClick={() => void transferOwnership(member)} className="rounded-md p-1.5 text-muted-foreground hover:bg-amber-50 hover:text-amber-600" title="Transfer ownership"><Crown size={14} /></button>}{canManage && member.role !== "owner" && <button type="button" onClick={() => void removeMember(member)} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600" title="Remove member"><Trash size={14} /></button>}</div></div>)}{members.length === 0 && <p className="p-10 text-center text-xs text-muted-foreground">No workspace members found.</p>}</div>
    </div>}

    <Sheet open={drawer !== null} onOpenChange={(open) => !open && setDrawer(null)}><SheetContent side="right" className="w-full p-0 sm:max-w-md"><div className="border-b border-border p-6"><SheetHeader><SheetTitle>{drawer === "create" ? "Create workspace" : "Edit workspace"}</SheetTitle><SheetDescription>{drawer === "create" ? "Create an isolated space for a new team." : "Update the workspace profile."}</SheetDescription></SheetHeader></div><form onSubmit={save} className="space-y-5 p-6"><label className="block space-y-2 text-xs font-semibold"><span>Workspace name</span><Input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required placeholder="Product Team" /></label><Button type="submit" disabled={saving || name.trim().length < 2} className="w-full">{saving ? "Saving..." : "Save workspace"}</Button></form></SheetContent></Sheet>
  </div>;
}
