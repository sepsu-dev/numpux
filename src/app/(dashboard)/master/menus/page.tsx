"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowClockwise, CaretDown, CaretUp, MagnifyingGlass, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import type { MasterMenu } from "@/types";
import { MENU_ICON_OPTIONS, getMenuIcon } from "@/lib/menu-icons";
import { usePrivilegesStore } from "@/stores/privileges-store";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function MasterMenusPage() {
  const { menus, sections, isLoading, loadAllPrivileges, updateMenu, reorderMenus, addMenu, removeMenu } = usePrivilegesStore();
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MasterMenu | null>(null);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [icon, setIcon] = useState("SquaresFour");
  const [section, setSection] = useState("");
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { void loadAllPrivileges(); }, [loadAllPrivileges]);
  const sectionNames = useMemo(() => Array.from(new Set(sections.map((item) => item.name))), [sections]);
  const parentCandidates = useMemo(() => menus.filter((item) => !item.parentId), [menus]);
  const filtered = useMemo(() => menus.filter((item) => (sectionFilter === "All" || item.section === sectionFilter) && `${item.name} ${item.path}`.toLowerCase().includes(query.toLowerCase())), [menus, query, sectionFilter]);

  const openCreate = () => {
    setEditing(null); setName(""); setPath(""); setIcon("SquaresFour"); setSection(sectionNames[0] || ""); setParentId(""); setIsActive(true); setOpen(true);
  };
  const openEdit = (item: MasterMenu) => {
    setEditing(item); setName(item.name); setPath(item.path); setIcon(item.icon || "SquaresFour"); setSection(item.section || sectionNames[0] || ""); setParentId(item.parentId || ""); setIsActive(item.isActive); setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedPath = path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`;
    const values = { name: name.trim(), path: normalizedPath, icon, section, parentId: parentId || null, isActive };
    const ok = editing ? await updateMenu(editing.id, values) : await addMenu(values);
    if (ok) setOpen(false);
  };
  const move = async (item: MasterMenu, direction: "up" | "down") => {
    const index = menus.findIndex((menu) => menu.id === item.id);
    const target = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= menus.length) return;
    const copy = [...menus]; const [moved] = copy.splice(index, 1); copy.splice(target, 0, moved); await reorderMenus(copy);
  };
  const remove = async (item: MasterMenu) => { await removeMenu(item.id); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2.5"><h2 className="text-2xl font-bold tracking-tight">Navigation</h2><span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-semibold text-muted-foreground">{filtered.length} menus</span></div><p className="mt-1 text-xs text-muted-foreground">Manage sidebar labels, routes, icons, hierarchy, and visibility.</p></div><div className="flex gap-2"><button onClick={openCreate} className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground"><Plus size={14} weight="bold" /> Add menu</button><button onClick={() => void loadAllPrivileges()} disabled={isLoading} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold disabled:opacity-50"><ArrowClockwise size={14} className={isLoading ? "animate-spin" : ""} /> Refresh</button></div></div>
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-card p-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full max-w-sm"><MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menus" className="w-full rounded-lg border border-border bg-card py-1.5 pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{query && <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"><X size={13} /></button>}</div><Select value={sectionFilter} onValueChange={setSectionFilter}><SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All sections</SelectItem>{sectionNames.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card"><table className="w-full text-left text-xs"><thead><tr className="border-b border-border/60 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><th className="px-4 py-3">Menu</th><th className="hidden px-4 py-3 sm:table-cell">Route</th><th className="hidden px-4 py-3 md:table-cell">Section</th><th className="px-4 py-3 text-center">Order</th><th className="px-4 py-3 text-center">Visible</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-border/50">
        {isLoading && menus.length === 0 ? Array.from({ length: 6 }).map((_, index) => <tr key={index}><td className="px-4 py-3"><Skeleton className="h-5 w-36" /></td><td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-5 w-24" /></td><td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-5 w-20" /></td><td colSpan={3} /></tr>) : filtered.length === 0 ? <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No menus found.</td></tr> : filtered.map((item) => { const Icon = getMenuIcon(item.icon); const absoluteIndex = menus.findIndex((menu) => menu.id === item.id); return <tr key={item.id} className="hover:bg-muted/20"><td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={16} /></span><div><p className="font-semibold">{item.name}</p>{item.parentId && <p className="text-[10px] text-muted-foreground">Submenu</p>}</div></div></td><td className="hidden px-4 py-3.5 sm:table-cell"><code className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">{item.path}</code></td><td className="hidden px-4 py-3.5 text-muted-foreground md:table-cell">{item.section}</td><td className="px-4 py-3.5"><div className="flex justify-center gap-1"><button disabled={absoluteIndex === 0} onClick={() => void move(item, "up")} className="rounded p-1 text-muted-foreground disabled:opacity-25"><CaretUp size={14} /></button><button disabled={absoluteIndex === menus.length - 1} onClick={() => void move(item, "down")} className="rounded p-1 text-muted-foreground disabled:opacity-25"><CaretDown size={14} /></button></div></td><td className="px-4 py-3.5 text-center"><Switch checked={item.isActive} onCheckedChange={() => void updateMenu(item.id, { isActive: !item.isActive })} /></td><td className="px-4 py-3.5 text-right"><button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary"><PencilSimple size={14} /></button><ConfirmDialog title="Delete menu?" description={`Delete menu "${item.name}"?`} confirmLabel="Delete menu" onConfirm={() => remove(item)}><button className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"><Trash size={14} /></button></ConfirmDialog></td></tr>; })}
      </tbody></table></div>

      <Sheet open={open} onOpenChange={setOpen}><SheetContent side="right" className="flex h-full w-full flex-col border-l border-border bg-card p-0 shadow-none sm:max-w-md"><form onSubmit={save} className="flex h-full flex-col"><div className="border-b border-border/60 px-6 py-5"><SheetHeader><SheetTitle className="text-lg font-bold">{editing ? "Edit menu" : "Add menu"}</SheetTitle><SheetDescription className="text-xs">Configure the route and sidebar presentation.</SheetDescription></SheetHeader></div><div className="flex-1 space-y-4 overflow-y-auto p-6">
        <Field label="Menu name"><input value={name} onChange={(event) => setName(event.target.value)} required autoFocus className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary" /></Field>
        <Field label="Route path"><input value={path} onChange={(event) => setPath(event.target.value)} required placeholder="/reports" className="h-10 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs outline-none focus:border-primary" /></Field>
        <Field label="Icon"><Select value={icon} onValueChange={setIcon}><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent>{MENU_ICON_OPTIONS.map((item) => { const Icon = item.icon; return <SelectItem key={item.name} value={item.name} className="text-xs"><div className="flex items-center gap-2"><Icon size={15} /><span>{item.label}</span></div></SelectItem>; })}</SelectContent></Select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Section"><Select value={section} onValueChange={setSection}><SelectTrigger className="h-10 text-xs"><SelectValue placeholder="Select section" /></SelectTrigger><SelectContent>{sectionNames.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Parent menu"><Select value={parentId || "none"} onValueChange={(value) => setParentId(value === "none" ? "" : value)}><SelectTrigger className="h-10 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Top-level</SelectItem>{parentCandidates.filter((item) => item.id !== editing?.id).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field></div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"><div><p className="text-xs font-semibold">Visible in sidebar</p><p className="text-[11px] text-muted-foreground">Users still need the matching privilege.</p></div><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
        <div className="rounded-lg border border-border/60 p-4"><p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preview</p><div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2.5 text-primary">{(() => { const Icon = getMenuIcon(icon); return <Icon size={17} weight="bold" />; })()}<span className="text-sm font-semibold">{name || "Menu name"}</span></div></div>
      </div><div className="flex justify-end gap-2.5 border-t border-border/60 bg-muted/20 px-6 py-4"><button type="button" onClick={() => setOpen(false)} className="h-9 rounded-lg border border-border px-4 text-xs font-semibold text-muted-foreground">Cancel</button><button type="submit" disabled={!name.trim() || !path.trim() || !section} className="h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground disabled:opacity-50">Save menu</button></div></form></SheetContent></Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><label className="text-xs font-semibold">{label}</label>{children}</div>; }
