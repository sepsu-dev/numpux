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
    CaretDown,
    ArrowUp,
    ArrowDown,
    Eye,
    EyeSlash,
    Crown,
    ListNumbers,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

interface MasterDataModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTab?: "menus" | "categories" | "issue_types" | "priorities";
    onCategoriesChanged?: (categories: string[]) => void;
}

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

export function MasterDataModal({
    open,
    onOpenChange,
    initialTab = "menus",
    onCategoriesChanged,
}: MasterDataModalProps) {
    const [tab, setTab] = useState<"menus" | "categories" | "issue_types" | "priorities">(initialTab);

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

    useEffect(() => {
        if (open) {
            setTab(initialTab);
            setMenuItems(getMasterMenuItems());
            setCategories(getMasterCategories());
            setIssueTypes(getMasterIssueTypes());
            setPriorities(getMasterPriorities());
        }
    }, [open, initialTab]);

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
        onCategoriesChanged?.(updated);
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
        onCategoriesChanged?.(updated);
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
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-xl w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border/60">
                        <SheetHeader className="p-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                    <SquaresFour size={17} weight="bold" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                            Project & Issue Settings
                                        </SheetTitle>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Crown size={11} weight="fill" />
                                            Admin
                                        </span>
                                    </div>
                                    <SheetDescription className="text-xs text-muted-foreground">
                                        Configure workspace navigation, components/categories, issue types, and priorities.
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-4 p-1 bg-muted/50 rounded-xl border border-border/50 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setTab("menus")}
                            className={cn(
                                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                                tab === "menus"
                                    ? "bg-card text-foreground shadow-xs border border-border/60"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <ListNumbers size={13} weight="bold" />
                            <span>Menu Order</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("categories")}
                            className={cn(
                                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                                tab === "categories"
                                    ? "bg-card text-foreground shadow-xs border border-border/60"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Tag size={13} weight="bold" />
                            <span>Categories ({categories.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("issue_types")}
                            className={cn(
                                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                                tab === "issue_types"
                                    ? "bg-card text-foreground shadow-xs border border-border/60"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CheckSquare size={13} weight="bold" />
                            <span>Issue Types ({issueTypes.length})</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("priorities")}
                            className={cn(
                                "flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                                tab === "priorities"
                                    ? "bg-card text-foreground shadow-xs border border-border/60"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Flag size={13} weight="bold" />
                            <span>Priorities ({priorities.length})</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* TAB 0: MENUS (SUPERADMIN) */}
                    {tab === "menus" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-1 border-b border-border/60">
                                <div>
                                    <div className="text-xs font-bold text-foreground">
                                        Sidebar Navigation & Order
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Reorder platform menus, customize display labels, and toggle menu visibility for all team members.
                                    </p>
                                </div>
                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {menuItems.filter((m) => m.enabled).length} Active
                                </span>
                            </div>

                            <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
                                {menuItems.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all text-xs",
                                            item.enabled
                                                ? "bg-card border-border/80 shadow-2xs"
                                                : "bg-muted/30 border-border/40 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div className="w-6 h-6 rounded-lg bg-muted text-muted-foreground font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <input
                                                    type="text"
                                                    value={item.label}
                                                    onChange={(e) => handleRenameMenu(item.id, e.target.value)}
                                                    className="w-full text-xs font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none transition-colors"
                                                    title="Click to edit label"
                                                />
                                                <p className="text-[10px] text-muted-foreground font-mono truncate">
                                                    Path: {item.path}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                            {/* Move Up */}
                                            <button
                                                type="button"
                                                disabled={index === 0}
                                                onClick={() => handleMoveMenu(index, "up")}
                                                className="w-7 h-7 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                                title="Move menu up"
                                            >
                                                <ArrowUp size={13} weight="bold" />
                                            </button>

                                            {/* Move Down */}
                                            <button
                                                type="button"
                                                disabled={index === menuItems.length - 1}
                                                onClick={() => handleMoveMenu(index, "down")}
                                                className="w-7 h-7 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                                title="Move menu down"
                                            >
                                                <ArrowDown size={13} weight="bold" />
                                            </button>

                                            {/* Visibility Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleMenu(item.id)}
                                                className={cn(
                                                    "w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ml-1",
                                                    item.enabled
                                                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                        : "border-border text-muted-foreground hover:bg-muted"
                                                )}
                                                title={item.enabled ? "Hide menu" : "Show menu"}
                                            >
                                                {item.enabled ? <Eye size={13} weight="bold" /> : <EyeSlash size={13} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 1: CATEGORIES */}
                    {tab === "categories" && (
                        <div className="space-y-4">
                            <form onSubmit={handleAddCategory} className="flex gap-2">
                                <Input
                                    placeholder="Add category (e.g. Mobile, Backend, Cloud, AI)..."
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-background/50 border-border focus:border-primary flex-1 font-medium"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={!newCategory.trim()}
                                    className="h-9 px-3.5 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer"
                                >
                                    <Plus size={13} className="mr-1 stroke-[2.5]" />
                                    Add
                                </Button>
                            </form>

                            <div className="space-y-1.5 pt-1">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Project Categories
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat}
                                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/60 group hover:border-border transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
                                                <span className="font-semibold text-foreground truncate">{cat}</span>
                                                {cat === "General" && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            {cat !== "General" && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(cat)}
                                                    className="text-muted-foreground hover:text-rose-600 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                                                    title={`Delete category "${cat}"`}
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: ISSUE TYPES */}
                    {tab === "issue_types" && (
                        <div className="space-y-4">
                            {/* Create form */}
                            <form onSubmit={handleAddIssueType} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                                <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                                    Create New Issue Type
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Issue Name (e.g. Spike, Epic, QA)..."
                                        value={newIssueName}
                                        onChange={(e) => setNewIssueName(e.target.value)}
                                        className="h-8.5 text-xs rounded-xl bg-background border-border"
                                    />
                                    <Input
                                        placeholder="Description (optional)..."
                                        value={newIssueDesc}
                                        onChange={(e) => setNewIssueDesc(e.target.value)}
                                        className="h-8.5 text-xs rounded-xl bg-background border-border"
                                    />
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                    {/* Icon Picker */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-muted-foreground mr-1">Icon:</span>
                                        {AVAILABLE_ICONS.map((item) => {
                                            const Icon = item.icon;
                                            const isSelected = newIssueIcon === item.name;
                                            return (
                                                <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={() => setNewIssueIcon(item.name as any)}
                                                    className={cn(
                                                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                                                        isSelected
                                                            ? "bg-primary text-primary-foreground shadow-xs"
                                                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                                                    )}
                                                    title={item.label}
                                                >
                                                    <Icon size={14} weight="bold" />
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Color Picker */}
                                    <div className="flex items-center gap-1">
                                        <span className="text-[11px] text-muted-foreground mr-1">Color:</span>
                                        {AVAILABLE_COLORS.map((c) => {
                                            const isSelected = newIssueColor === c.class;
                                            return (
                                                <button
                                                    key={c.label}
                                                    type="button"
                                                    onClick={() => setNewIssueColor(c.class)}
                                                    className={cn(
                                                        "w-5 h-5 rounded-full cursor-pointer transition-all flex items-center justify-center",
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
                                        className="h-8 px-3 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer"
                                    >
                                        <Plus size={13} className="mr-1 stroke-[2.5]" />
                                        Add Issue Type
                                    </Button>
                                </div>
                            </form>

                            {/* Existing list */}
                            <div className="space-y-1.5 pt-1">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Active Issue Types ({issueTypes.length})
                                </div>
                                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                    {issueTypes.map((it) => {
                                        const Icon = ISSUE_TYPE_ICONS[it.iconName] || CheckSquare;
                                        return (
                                            <div
                                                key={it.id}
                                                className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/60 group hover:border-border transition-colors text-xs"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0 border", it.colorClass)}>
                                                        <Icon size={14} weight="bold" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-foreground">{it.name}</span>
                                                            {it.isDefault && (
                                                                <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                                                                    System Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        {it.description && (
                                                            <p className="text-[10px] text-muted-foreground truncate">{it.description}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {!it.isDefault && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteIssueType(it.id)}
                                                        className="text-muted-foreground hover:text-rose-600 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
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
                        </div>
                    )}

                    {/* TAB 3: PRIORITIES */}
                    {tab === "priorities" && (
                        <div className="space-y-4">
                            {/* Create form */}
                            <form onSubmit={handleAddPriority} className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-2.5">
                                <div className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                                    Create New Priority Level
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Priority Name (e.g. Blocker, Critical, Trivial)..."
                                        value={newPriorityName}
                                        onChange={(e) => setNewPriorityName(e.target.value)}
                                        className="h-8.5 text-xs rounded-xl bg-background border-border flex-1"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!newPriorityName.trim()}
                                        className="h-8.5 px-3 rounded-xl text-xs bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all shrink-0 cursor-pointer"
                                    >
                                        <Plus size={13} className="mr-1 stroke-[2.5]" />
                                        Add Priority
                                    </Button>
                                </div>

                                <div className="flex items-center gap-1 pt-1">
                                    <span className="text-[11px] text-muted-foreground mr-1">Indicator Color:</span>
                                    {AVAILABLE_COLORS.map((c) => {
                                        const isSelected = newPriorityDot === c.dot;
                                        return (
                                            <button
                                                key={c.label}
                                                type="button"
                                                onClick={() => setNewPriorityDot(c.dot)}
                                                className={cn(
                                                    "w-5 h-5 rounded-full cursor-pointer transition-all flex items-center justify-center",
                                                    c.dot,
                                                    isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : "opacity-70 hover:opacity-100"
                                                )}
                                                title={c.label}
                                            />
                                        );
                                    })}
                                </div>
                            </form>

                            {/* Existing priorities list */}
                            <div className="space-y-1.5 pt-1">
                                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Priority Levels ({priorities.length})
                                </div>
                                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                    {priorities.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/60 group hover:border-border transition-colors text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", p.dotColor)} />
                                                <span className="font-semibold text-foreground">{p.name}</span>
                                                {p.isDefault && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            {!p.isDefault && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeletePriority(p.id)}
                                                    className="text-muted-foreground hover:text-rose-600 p-1 rounded-md opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                                                    title={`Delete priority "${p.name}"`}
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
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
