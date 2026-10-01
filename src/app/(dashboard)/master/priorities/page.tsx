"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import type { MasterPriorityItem } from "@/lib/master-data";
import { useMasterDataStore } from "@/stores/master-data-store";
import { MasterDataNotice } from "@/components/settings/master-data-notice";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLOR_PRESETS = [
  { label: "Brand Green", dot: "bg-primary", badge: "bg-primary/10 text-primary border-primary/20" },
  { label: "Brand Blue", dot: "bg-[#2984f7]", badge: "bg-[#eef6ff] text-[#1768c5] border-[#c8e0ff]" },
  { label: "Brand Orange", dot: "bg-[#f5a300]", badge: "bg-[#fff7e6] text-[#946000] border-[#ffe0a3]" },
  { label: "Rose", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200/80" },
  { label: "Purple", dot: "bg-purple-500", badge: "bg-purple-50 text-purple-700 border-purple-200/70" },
  { label: "Slate", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-700 border-slate-200/80" },
] as const;

export default function MasterPrioritiesPage() {
  const { priorities, loadPriorities, addPriority, updatePriority, removePriority, isLoading, isSaving, error } = useMasterDataStore();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MasterPriorityItem | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [priorityColor, setPriorityColor] = useState(0);
  const [severityColor, setSeverityColor] = useState(0);

  useEffect(() => { void loadPriorities(); }, [loadPriorities]);
  const filtered = useMemo(() => priorities.filter((item) => item.name.toLowerCase().includes(query.toLowerCase())), [priorities, query]);

  const openCreate = () => {
    setEditing(null); setName(""); setLevel(Math.min(5, priorities.length + 1)); setPriorityColor(0); setSeverityColor(0); setOpen(true);
  };
  const openEdit = (item: MasterPriorityItem) => {
    setEditing(item); setName(item.name); setLevel(item.level);
    const priorityIndex = COLOR_PRESETS.findIndex((preset) => preset.dot === item.dotColor && preset.badge === item.badgeClass);
    const severityIndex = COLOR_PRESETS.findIndex((preset) => preset.badge === item.severityClass);
    setPriorityColor(priorityIndex >= 0 ? priorityIndex : 0);
    setSeverityColor(severityIndex >= 0 ? severityIndex : 0);
    setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const priorityPreset = COLOR_PRESETS[priorityColor];
    const severityPreset = COLOR_PRESETS[severityColor];
    const values = { name: trimmed, level, dotColor: priorityPreset.dot, badgeClass: priorityPreset.badge, severityClass: severityPreset.badge };
    const ok = editing
      ? await updatePriority(editing.id, values)
      : await addPriority({ id: trimmed, ...values });
    if (ok) setOpen(false);
  };

  return (
    <div className="space-y-6">
      <MasterDataNotice isLoading={isLoading} error={error} />
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div><div className="flex items-center gap-2.5"><h2 className="text-2xl font-bold tracking-tight">Priorities</h2><span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">{filtered.length} levels</span></div><p className="mt-1 text-xs text-muted-foreground">Configure priority badges and independent severity colors.</p></div>
        <button onClick={openCreate} disabled={isLoading} className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><Plus size={14} weight="bold" /> Add priority</button>
      </div>
      <div className="flex items-center rounded-lg border border-border/60 bg-card p-2.5"><div className="relative w-full max-w-sm"><MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search priorities" className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>}</div></div>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
        <table className="w-full text-left text-xs"><thead><tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><th className="px-5 py-3">Priority</th><th className="px-5 py-3 text-center">Severity</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border/50">{filtered.length === 0 && !isLoading ? <tr><td colSpan={3} className="py-12 text-center text-muted-foreground">No priorities found.</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-muted/20"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className={`h-3 w-3 rounded-full ${item.dotColor}`} /><span className={`rounded-md border px-2.5 py-1 font-semibold ${item.badgeClass}`}>{item.name}</span>{item.isDefault && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Default</span>}</div></td><td className="px-5 py-3.5 text-center"><span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold ${item.severityClass}`}>Level {item.level}</span></td><td className="px-5 py-3.5 text-right"><button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Edit priority"><PencilSimple size={14} /></button><button onClick={() => void removePriority(item.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600" title="Delete priority"><Trash size={14} /></button></td></tr>)}</tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col border-l border-border bg-card p-0 shadow-none sm:max-w-md">
          <form onSubmit={save} className="flex h-full flex-col">
            <div className="border-b border-border/60 px-6 py-5"><SheetHeader><SheetTitle className="text-lg font-bold">{editing ? "Edit priority" : "Add priority"}</SheetTitle><SheetDescription className="text-xs">Priority color and severity color can be configured separately.</SheetDescription></SheetHeader></div>
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-1.5"><label className="text-xs font-semibold">Priority name</label><input value={name} onChange={(event) => setName(event.target.value)} required autoFocus className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
              <div className="space-y-1.5"><label className="text-xs font-semibold">Severity level</label><input type="number" min={1} max={5} value={level} onChange={(event) => setLevel(Number(event.target.value))} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary" /></div>
              <ColorPicker label="Priority color" value={priorityColor} onChange={setPriorityColor} />
              <ColorPicker label="Severity color" value={severityColor} onChange={setSeverityColor} />
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4"><p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</p><div className="flex items-center justify-between gap-3"><span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${COLOR_PRESETS[priorityColor].badge}`}>{name || "Priority"}</span><span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${COLOR_PRESETS[severityColor].badge}`}>Level {level}</span></div></div>
            </div>
            <div className="flex justify-end gap-2.5 border-t border-border/60 bg-muted/20 px-6 py-4"><button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground">Cancel</button><button type="submit" disabled={isSaving || !name.trim()} className="h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{isSaving ? "Saving..." : "Save priority"}</button></div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="space-y-1.5"><label className="text-xs font-semibold">{label}</label><Select value={String(value)} onValueChange={(next) => onChange(Number(next))}><SelectTrigger className="h-10 w-full text-xs"><SelectValue /></SelectTrigger><SelectContent>{COLOR_PRESETS.map((preset, index) => <SelectItem key={preset.label} value={String(index)} className="text-xs"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${preset.dot}`} /><span>{preset.label}</span></div></SelectItem>)}</SelectContent></Select></div>;
}
