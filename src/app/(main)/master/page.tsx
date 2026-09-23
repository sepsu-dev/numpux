"use client";

import { useState, useEffect } from "react";
import {
    Tag,
    Plus,
    Trash,
    Check,
    CheckSquare,
    Bug,
    BookmarkSimple,
    Lightning,
    Shield,
    Fire,
    Rocket,
    Flag,
    SquaresFour,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeSlash,
    Crown,
    ListNumbers,
    Sparkle,
    CaretRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    MasterCategoryItem,
    MasterIssueTypeItem,
    MasterPriorityItem,
    MasterMenuItem,
    ISSUE_TYPE_ICONS,
    getMasterCategories,
    saveMasterCategories,
    getMasterIssueTypes,
    saveMasterIssueTypes,
    getMasterPriorities,
    saveMasterPriorities,
    getMasterMenuItems,
    saveMasterMenuItems,
} from "@/lib/master-data";

const AVAILABLE_ICONS = [
    { name: "CheckSquare", icon: CheckSquare, label: "Task Check" },
    { name: "Bug", icon: Bug, label: "Bug Defect" },
    { name: "BookmarkSimple", icon: BookmarkSimple, label: "Story Bookmark" },
    { name: "Lightning", icon: Lightning, label: "Lightning Improvement" },
    { name: "Shield", icon: Shield, label: "Security Shield" },
    { name: "Fire", icon: Fire, label: "Urgent Fire" },
    { name: "Rocket", icon: Rocket, label: "Feature Launch" },
] as const;

const AVAILABLE_COLORS = [
    { label: "Blue", class: "text-blue-500 bg-blue-500/10 border-blue-200/50 dark:border-blue-900/50", dot: "bg-blue-500" },
    { label: "Rose", class: "text-rose-500 bg-rose-500/10 border-rose-200/50 dark:border-rose-900/50", dot: "bg-rose-500" },
    { label: "Emerald", class: "text-emerald-500 bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-900/50", dot: "bg-emerald-500" },
    { label: "Amber", class: "text-amber-500 bg-amber-500/10 border-amber-200/50 dark:border-amber-900/50", dot: "bg-amber-500" },
    { label: "Purple", class: "text-purple-500 bg-purple-500/10 border-purple-200/50 dark:border-purple-900/50", dot: "bg-purple-500" },
    { label: "Slate", class: "text-slate-500 bg-slate-500/10 border-slate-200/50 dark:border-slate-800", dot: "bg-slate-400" },
];

export default function MasterDataPage() {
    const [tab, setTab] = useState<"menus" | "categories" | "issue_types" | "priorities">("menus");

    // Menus state (Superadmin)
    const [menuItems, setMenuItems] = useState<MasterMenuItem[]>([]);

    // Categories state
    const [categories, setCategories] = useState<string[]>([]);
    const [newCategory, setNewCategory] = useState("");

    // Issue Types state
    const [issueTypes, setIssueTypes] = useState<MasterIssueTypeItem[]>([]);
    const [newIssueName, setNewIssueName] = useState("");
    const [newIssueDesc, setNewIssueDesc] = useState("");
    const [newIssueIcon, setNewIssueIcon] = useState<MasterIssueTypeItem["iconName"]>("CheckSquare");
    const [newIssueColor, setNewIssueColor] = useState(AVAILABLE_COLORS[0].class);

    // Priorities state
    const [priorities, setPriorities] = useState<MasterPriorityItem[]>([]);
    const [newPriorityName, setNewPriorityName] = useState("");
    const [newPriorityDot, setNewPriorityDot] = useState(AVAILABLE_COLORS[0].dot);

    const loadData = () => {
        setMenuItems(getMasterMenuItems());
        setCategories(getMasterCategories());
        setIssueTypes(getMasterIssueTypes());
        setPriorities(getMasterPriorities());
    };

    useEffect(() => {
        loadData();
        const handleUpdate = () => loadData();
        window.addEventListener("numpux_master_data_updated", handleUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleUpdate);
    }, []);

    // Menu handlers (Superadmin)
    const handleMoveMenu = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= menuItems.length) return;
        const copy = [...menuItems];
        const [moved] = copy.splice(index, 1);
        copy.splice(targetIndex, 0, moved);
        const reordered = copy.map((item, idx) => ({ ...item, order: idx + 1 }));
        setMenuItems(reordered);
        saveMasterMenuItems(reordered);
        toast.success(`Menu "${moved.label}" moved ${direction}!`);
    };

    const handleToggleMenu = (id: string) => {
        const updated = menuItems.map((item) =>
            item.id === id ? { ...item, enabled: !item.enabled } : item
        );
        setMenuItems(updated);
        saveMasterMenuItems(updated);
        const target = updated.find((i) => i.id === id);
        toast.success(`Menu "${target?.label}" is now ${target?.enabled ? "visible" : "hidden"}`);
    };

    const handleRenameMenu = (id: string, newLabel: string) => {
        const updated = menuItems.map((item) =>
            item.id === id ? { ...item, label: newLabel } : item
        );
        setMenuItems(updated);
        saveMasterMenuItems(updated);
    };

    // Categories operations
    const handleAddCategory = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newCategory.trim();
        if (!trimmed) return;
        if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`Category "${trimmed}" already exists.`);
            return;
        }
        const updated = [...categories, trimmed];
        setCategories(updated);
        saveMasterCategories(updated);
        toast.success(`Category "${trimmed}" added!`);
        setNewCategory("");
    };

    const handleDeleteCategory = (cat: string) => {
        if (cat === "General") {
            toast.error("Category 'General' cannot be removed.");
            return;
        }
        const updated = categories.filter((c) => c !== cat);
        setCategories(updated);
        saveMasterCategories(updated);
        toast.success(`Category "${cat}" removed.`);
    };

    // Issue Types operations
    const handleAddIssueType = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newIssueName.trim();
        if (!trimmed) return;
        if (issueTypes.some((it) => it.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`Issue type "${trimmed}" already exists.`);
            return;
        }
        const newItem: MasterIssueTypeItem = {
            id: trimmed,
            name: trimmed,
            description: newIssueDesc.trim() || undefined,
            iconName: newIssueIcon,
            colorClass: newIssueColor,
        };
        const updated = [...issueTypes, newItem];
        setIssueTypes(updated);
        saveMasterIssueTypes(updated);
        toast.success(`Issue Type "${trimmed}" created!`);
        setNewIssueName("");
        setNewIssueDesc("");
    };

    const handleDeleteIssueType = (id: string) => {
        const item = issueTypes.find((it) => it.id === id);
        if (item?.isDefault) {
            toast.error(`Default issue type "${item.name}" cannot be removed.`);
            return;
        }
        const updated = issueTypes.filter((it) => it.id !== id);
        setIssueTypes(updated);
        saveMasterIssueTypes(updated);
        toast.success(`Issue type "${item?.name || id}" removed.`);
    };

    // Priorities operations
    const handleAddPriority = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = newPriorityName.trim();
        if (!trimmed) return;
        if (priorities.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`Priority "${trimmed}" already exists.`);
            return;
        }
        const newItem: MasterPriorityItem = {
            id: trimmed,
            name: trimmed,
            level: priorities.length + 1,
            dotColor: newPriorityDot,
            badgeClass: "bg-muted/80 text-foreground border-border/80",
        };
        const updated = [...priorities, newItem];
        setPriorities(updated);
        saveMasterPriorities(updated);
        toast.success(`Priority "${trimmed}" added!`);
        setNewPriorityName("");
    };

    const handleDeletePriority = (id: string) => {
        const item = priorities.find((p) => p.id === id);
        if (item?.isDefault) {
            toast.error(`Default priority "${item.name}" cannot be removed.`);
            return;
        }
        const updated = priorities.filter((p) => p.id !== id);
        setPriorities(updated);
        saveMasterPriorities(updated);
        toast.success(`Priority "${item?.name || id}" removed.`);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
            {/* Page Header */}
            <div className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-6 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shadow-xs border border-amber-500/20">
                            <Crown size={22} weight="fill" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-foreground">
                                    Project & Issue Configuration
                                </h1>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkle size={11} weight="fill" />
                                    Project Settings
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Centralized project settings, issue types, workflow priority schemes, and components.
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl border border-border bg-card text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Menus</span>
                            <span className="text-xs font-bold text-foreground">{menuItems.filter((m) => m.enabled).length}/{menuItems.length}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl border border-border bg-card text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Categories</span>
                            <span className="text-xs font-bold text-foreground">{categories.length}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl border border-border bg-card text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Issue Types</span>
                            <span className="text-xs font-bold text-foreground">{issueTypes.length}</span>
                        </div>
                        <div className="px-3 py-1.5 rounded-xl border border-border bg-card text-center">
                            <span className="block text-[10px] text-muted-foreground uppercase font-semibold">Priorities</span>
                            <span className="text-xs font-bold text-foreground">{priorities.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
                {/* Horizontal Navigation Tabs */}
                <div className="flex items-center gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/60 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setTab("menus")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap",
                            tab === "menus"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <ListNumbers size={16} weight="bold" />
                        <span>Menu & Navigation ({menuItems.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("categories")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap",
                            tab === "categories"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <Tag size={16} weight="bold" />
                        <span>Categories ({categories.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("issue_types")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap",
                            tab === "issue_types"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <CheckSquare size={16} weight="bold" />
                        <span>Issue Types ({issueTypes.length})</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("priorities")}
                        className={cn(
                            "flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap",
                            tab === "priorities"
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                    >
                        <Flag size={16} weight="bold" />
                        <span>Priorities ({priorities.length})</span>
                    </button>
                </div>

                {/* TAB 0: MENUS */}
                {tab === "menus" && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border/60 gap-2">
                            <div>
                                <h2 className="text-sm font-bold text-foreground">
                                    Sidebar Navigation & Menu Hierarchy
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Atur posisi urutan menu di sidebar, ubah label nama menu, dan tampilkan atau sembunyikan menu secara global.
                                </p>
                            </div>
                            <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full self-start sm:self-auto">
                                {menuItems.filter((m) => m.enabled).length} Visible Menu Items
                            </span>
                        </div>

                        <div className="space-y-2.5">
                            {menuItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center justify-between p-3.5 rounded-xl border transition-all text-xs",
                                        item.enabled
                                            ? "bg-card border-border/80 shadow-2xs"
                                            : "bg-muted/30 border-border/40 opacity-60"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-border/50">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0 flex-1 pr-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item.label}
                                                    onChange={(e) => handleRenameMenu(item.id, e.target.value)}
                                                    className="font-bold text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors text-xs py-0.5"
                                                    title="Click to rename"
                                                />
                                                <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-1.5 py-0.5 rounded border border-border/40">
                                                    id: {item.id}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                                                Target route: {item.path}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Move Up */}
                                        <button
                                            type="button"
                                            disabled={index === 0}
                                            onClick={() => handleMoveMenu(index, "up")}
                                            className="w-8 h-8 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                            title="Move menu up"
                                        >
                                            <ArrowUp size={14} weight="bold" />
                                        </button>

                                        {/* Move Down */}
                                        <button
                                            type="button"
                                            disabled={index === menuItems.length - 1}
                                            onClick={() => handleMoveMenu(index, "down")}
                                            className="w-8 h-8 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                            title="Move menu down"
                                        >
                                            <ArrowDown size={14} weight="bold" />
                                        </button>

                                        {/* Visibility Toggle */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleMenu(item.id)}
                                            className={cn(
                                                "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ml-1",
                                                item.enabled
                                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                    : "border-border text-muted-foreground hover:bg-muted"
                                            )}
                                            title={item.enabled ? "Hide menu" : "Show menu"}
                                        >
                                            {item.enabled ? <Eye size={14} weight="bold" /> : <EyeSlash size={14} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 1: CATEGORIES */}
                {tab === "categories" && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="pb-4 border-b border-border/60">
                            <h2 className="text-sm font-bold text-foreground">
                                Master Categories
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Kategori default untuk pengelompokan project dan task inisiatif.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <Input
                                placeholder="Add category (e.g. Mobile, Backend, Cloud, AI, Security)..."
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                className="h-10 text-xs rounded-xl bg-background border-border focus:border-primary flex-1 font-medium"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                disabled={!newCategory.trim()}
                                className="h-10 px-4 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer"
                            >
                                <Plus size={14} className="mr-1.5 stroke-[2.5]" />
                                Add Category
                            </Button>
                        </form>

                        {/* List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {categories.map((cat) => (
                                <div
                                    key={cat}
                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/70 hover:border-border transition-colors text-xs"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-full bg-primary/70 shrink-0" />
                                        <span className="font-semibold text-foreground truncate">{cat}</span>
                                        {cat === "General" && (
                                            <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    {cat !== "General" && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteCategory(cat)}
                                            className="text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all cursor-pointer hover:bg-rose-500/10"
                                            title={`Delete category "${cat}"`}
                                        >
                                            <Trash size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: ISSUE TYPES */}
                {tab === "issue_types" && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="pb-4 border-b border-border/60">
                            <h2 className="text-sm font-bold text-foreground">
                                Master Issue Types (Jira-style)
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Tipe issue bawaan dan kustom untuk sprint backlog (Task, Bug, Story, Epic, dll).
                            </p>
                        </div>

                        {/* Create form */}
                        <form onSubmit={handleAddIssueType} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3.5">
                            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Buat Issue Type Baru
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Input
                                    placeholder="Issue Name (e.g. Spike, Epic, QA, Vulnerability)..."
                                    value={newIssueName}
                                    onChange={(e) => setNewIssueName(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background border-border"
                                />
                                <Input
                                    placeholder="Description (optional)..."
                                    value={newIssueDesc}
                                    onChange={(e) => setNewIssueDesc(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background border-border"
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                {/* Icon Picker */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground font-medium mr-1">Icon:</span>
                                    {AVAILABLE_ICONS.map((item) => {
                                        const Icon = item.icon;
                                        const isSelected = newIssueIcon === item.name;
                                        return (
                                            <button
                                                key={item.name}
                                                type="button"
                                                onClick={() => setNewIssueIcon(item.name as any)}
                                                className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground shadow-xs"
                                                        : "bg-background border border-border text-muted-foreground hover:text-foreground"
                                                )}
                                                title={item.label}
                                            >
                                                <Icon size={16} weight="bold" />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Color Picker */}
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground font-medium mr-1">Badge Accent:</span>
                                    {AVAILABLE_COLORS.map((c) => {
                                        const isSelected = newIssueColor === c.class;
                                        return (
                                            <button
                                                key={c.label}
                                                type="button"
                                                onClick={() => setNewIssueColor(c.class)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full cursor-pointer transition-all flex items-center justify-center",
                                                    c.dot,
                                                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "opacity-70 hover:opacity-100"
                                                )}
                                                title={c.label}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end pt-1">
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!newIssueName.trim()}
                                    className="h-9 px-4 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                                >
                                    <Plus size={14} className="mr-1.5 stroke-[2.5]" />
                                    Add Issue Type
                                </Button>
                            </div>
                        </form>

                        {/* Existing list */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {issueTypes.map((it) => {
                                const Icon = ISSUE_TYPE_ICONS[it.iconName] || CheckSquare;
                                return (
                                    <div
                                        key={it.id}
                                        className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/70 hover:border-border transition-colors text-xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border", it.colorClass)}>
                                                <Icon size={16} weight="bold" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground">{it.name}</span>
                                                    {it.isDefault && (
                                                        <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                                            System
                                                        </span>
                                                    )}
                                                </div>
                                                {it.description && (
                                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{it.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {!it.isDefault && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteIssueType(it.id)}
                                                className="text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all cursor-pointer hover:bg-rose-500/10"
                                                title={`Delete issue type "${it.name}"`}
                                            >
                                                <Trash size={14} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB 3: PRIORITIES */}
                {tab === "priorities" && (
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-2xs space-y-6">
                        <div className="pb-4 border-b border-border/60">
                            <h2 className="text-sm font-bold text-foreground">
                                Master Priorities
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Tingkat urgensi dan bobot prioritas tiket task.
                            </p>
                        </div>

                        {/* Create form */}
                        <form onSubmit={handleAddPriority} className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3.5">
                            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Buat Level Prioritas Baru
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Priority Name (e.g. Blocker, Critical, Trivial)..."
                                    value={newPriorityName}
                                    onChange={(e) => setNewPriorityName(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background border-border flex-1"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!newPriorityName.trim()}
                                    className="h-9 px-4 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer"
                                >
                                    <Plus size={14} className="mr-1.5 stroke-[2.5]" />
                                    Add Priority
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-muted-foreground font-medium mr-1">Indicator Dot Color:</span>
                                {AVAILABLE_COLORS.map((c) => {
                                    const isSelected = newPriorityDot === c.dot;
                                    return (
                                        <button
                                            key={c.label}
                                            type="button"
                                            onClick={() => setNewPriorityDot(c.dot)}
                                            className={cn(
                                                "w-6 h-6 rounded-full cursor-pointer transition-all flex items-center justify-center",
                                                c.dot,
                                                isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "opacity-70 hover:opacity-100"
                                            )}
                                            title={c.label}
                                        />
                                    );
                                })}
                            </div>
                        </form>

                        {/* List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {priorities.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/70 hover:border-border transition-colors text-xs"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className={cn("w-3 h-3 rounded-full shrink-0 shadow-2xs", p.dotColor)} />
                                        <span className="font-bold text-foreground">{p.name}</span>
                                        {p.isDefault && (
                                            <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider">
                                                Default
                                            </span>
                                        )}
                                    </div>

                                    {!p.isDefault && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePriority(p.id)}
                                            className="text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-all cursor-pointer hover:bg-rose-500/10"
                                            title={`Delete priority "${p.name}"`}
                                        >
                                            <Trash size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
