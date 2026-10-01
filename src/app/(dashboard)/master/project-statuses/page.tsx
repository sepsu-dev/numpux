"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import type { MasterProjectStatusItem } from "@/lib/master-data";
import { useMasterDataStore } from "@/stores/master-data-store";
import { MasterDataNotice } from "@/components/settings/master-data-notice";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = [
  { label: "Brand Green", value: "bg-primary/10 text-primary border-primary/20" },
  { label: "Brand Blue", value: "bg-[#eef6ff] text-[#1768c5] border-[#c8e0ff]" },
  { label: "Brand Orange", value: "bg-[#fff7e6] text-[#946000] border-[#ffe0a3]" },
  { label: "Slate", value: "bg-slate-100 text-slate-700 border-slate-200" },
  { label: "Rose", value: "bg-rose-50 text-rose-700 border-rose-200" },
] as const;

export default function MasterProjectStatusesPage() {
  const { projectStatuses, loadProjectStatuses, addProjectStatus, updateProjectStatus, removeProjectStatus, isLoading, isSaving, error } = useMasterDataStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MasterProjectStatusItem | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorClass, setColorClass] = useState<string>(COLORS[1].value);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => { void loadProjectStatuses(); }, [loadProjectStatuses]);
  const filtered = useMemo(() => projectStatuses.filter((item) => `${item.name} ${item.description || ""}`.toLowerCase().includes(query.toLowerCase())), [projectStatuses, query]);

  const showCreate = () => {
    setEditing(null); setName(""); setDescription(""); setColorClass(COLORS[1].value); setIsCompleted(false); setOpen(true);
  };
  const showEdit = (item: MasterProjectStatusItem) => {
    setEditing(item); setName(item.name); setDescription(item.description || ""); setColorClass(item.colorClass); setIsCompleted(item.isCompleted); setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const values = { name: trimmed, description: description.trim() || undefined, colorClass, isCompleted };
    const ok = editing
      ? await updateProjectStatus(editing.id, values)
      : await addProjectStatus({ id: crypto.randomUUID(), ...values, order: projectStatuses.length + 1 });
    if (ok) setOpen(false);
  };

  return (
    <div className="space-y-6">
      <MasterDataNotice isLoading={isLoading} error={error} />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight">Project statuses</h2>
            <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">{filtered.length} statuses</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Configure the lifecycle values used by every project.</p>
        </div>
        <button onClick={showCreate} disabled={isLoading || isSaving} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          <Plus size={14} weight="bold" /> Create status
        </button>
      </div>

      <div className="flex items-center rounded-lg border border-border/60 bg-card p-2.5">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project statuses" className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <table className="w-full text-left text-xs">
          <thead><tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><th className="px-5 py-3">Status</th><th className="hidden px-5 py-3 sm:table-cell">Description</th><th className="px-5 py-3 text-center">Type</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border/50">
            {filtered.length === 0 && !isLoading ? <tr><td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">No project statuses found.</td></tr> : filtered.map((item) => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-5 py-3.5"><span className={`inline-flex rounded-md border px-2.5 py-1 font-semibold ${item.colorClass}`}>{item.name}</span>{item.isDefault && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Default</span>}</td>
                <td className="hidden px-5 py-3.5 text-muted-foreground sm:table-cell">{item.description || "-"}</td>
                <td className="px-5 py-3.5 text-center text-muted-foreground">{item.isCompleted ? "Completed" : "Open"}</td>
                <td className="px-5 py-3.5 text-right"><button onClick={() => showEdit(item)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"><PencilSimple size={14} /></button>{!item.isDefault && <button onClick={() => void removeProjectStatus(item.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"><Trash size={14} /></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-base font-bold">{editing ? "Edit project status" : "Create project status"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4 pt-2">
            <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Name</label><input value={name} onChange={(event) => setName(event.target.value)} required autoFocus className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Description</label><input value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Color</label><Select value={colorClass} onValueChange={setColorClass}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent>{COLORS.map((color) => <SelectItem key={color.label} value={color.value} className="text-xs">{color.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label className="text-xs font-semibold text-muted-foreground">Type</label><Select value={isCompleted ? "completed" : "open"} onValueChange={(value) => setIsCompleted(value === "completed")}><SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
            </div>
            <DialogFooter className="gap-2 pt-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{isSaving ? "Saving..." : "Save status"}</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
