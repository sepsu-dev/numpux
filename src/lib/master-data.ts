import {
    CheckSquare,
    Bug,
    BookmarkSimple,
    Lightning,
    Shield,
    Fire,
    Rocket,
    Tag,
} from "@phosphor-icons/react";

export interface MasterCategoryItem {
    id: string;
    name: string;
    isDefault?: boolean;
}

export interface MasterIssueTypeItem {
    id: string;
    name: string;
    description?: string;
    iconName: "CheckSquare" | "Bug" | "BookmarkSimple" | "Lightning" | "Shield" | "Fire" | "Rocket";
    colorClass: string; // e.g. "text-blue-500 bg-blue-500/10"
    isDefault?: boolean;
}

export interface MasterPriorityItem {
    id: string;
    name: string;
    level: number; // 1-5
    dotColor: string; // e.g. "bg-amber-500"
    badgeClass: string;
    isDefault?: boolean;
}

export interface MasterMenuItem {
    id: "dashboard" | "tasks" | "projects" | "master";
    label: string;
    path: string;
    enabled: boolean;
    order: number;
}

export const DEFAULT_MASTER_MENU_ITEMS: MasterMenuItem[] = [
    { id: "dashboard", label: "Summary", path: "/dashboard", enabled: true, order: 1 },
    { id: "tasks", label: "Board & Backlog", path: "/tasks", enabled: true, order: 2 },
    { id: "projects", label: "Projects", path: "/projects", enabled: true, order: 3 },
    { id: "master", label: "Project Settings", path: "/master", enabled: true, order: 4 },
];

export const ISSUE_TYPE_ICONS: Record<string, any> = {
    CheckSquare,
    Bug,
    BookmarkSimple,
    Lightning,
    Shield,
    Fire,
    Rocket,
};

export const DEFAULT_MASTER_CATEGORIES: MasterCategoryItem[] = [
    { id: "General", name: "General", isDefault: true },
    { id: "Product & Tech", name: "Product & Tech" },
    { id: "Client Work", name: "Client Work" },
    { id: "Operations", name: "Operations" },
    { id: "Marketing & Growth", name: "Marketing & Growth" },
    { id: "Personal / Self", name: "Personal / Self" },
];

export const DEFAULT_MASTER_ISSUE_TYPES: MasterIssueTypeItem[] = [
    {
        id: "Task",
        name: "Task",
        description: "General work or actionable task",
        iconName: "CheckSquare",
        colorClass: "text-blue-500 bg-blue-500/10 border-blue-200/50 dark:border-blue-900/50",
        isDefault: true,
    },
    {
        id: "Bug",
        name: "Bug",
        description: "Defect, error, or unexpected behavior",
        iconName: "Bug",
        colorClass: "text-rose-500 bg-rose-500/10 border-rose-200/50 dark:border-rose-900/50",
        isDefault: true,
    },
    {
        id: "Story",
        name: "Story",
        description: "User story or deliverable feature",
        iconName: "BookmarkSimple",
        colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-900/50",
        isDefault: true,
    },
    {
        id: "Improvement",
        name: "Improvement",
        description: "Refactoring, optimization, or UI polish",
        iconName: "Lightning",
        colorClass: "text-purple-500 bg-purple-500/10 border-purple-200/50 dark:border-purple-900/50",
    },
];

export const DEFAULT_MASTER_PRIORITIES: MasterPriorityItem[] = [
    {
        id: "Low",
        name: "Low",
        level: 1,
        dotColor: "bg-slate-400",
        badgeClass: "bg-slate-50 text-slate-600 border-slate-200/80 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
        isDefault: true,
    },
    {
        id: "Medium",
        name: "Medium",
        level: 2,
        dotColor: "bg-sky-500",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
        isDefault: true,
    },
    {
        id: "High",
        name: "High",
        level: 3,
        dotColor: "bg-amber-500",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
        isDefault: true,
    },
    {
        id: "Urgent",
        name: "Urgent",
        level: 4,
        dotColor: "bg-rose-500",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
        isDefault: true,
    },
];

const STORAGE_KEYS = {
    CATEGORIES: "numpux_master_categories",
    ISSUE_TYPES: "numpux_master_issue_types",
    PRIORITIES: "numpux_master_priorities",
    MENUS: "numpux_master_menus",
};

export function getMasterMenuItems(): MasterMenuItem[] {
    if (typeof window === "undefined") return DEFAULT_MASTER_MENU_ITEMS;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.MENUS);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Merge any newly introduced default menu items (e.g. "master") if not present
                const existingIds = new Set(parsed.map((item: MasterMenuItem) => item.id));
                const missingDefaults = DEFAULT_MASTER_MENU_ITEMS.filter((item) => !existingIds.has(item.id));
                if (missingDefaults.length > 0) {
                    const merged = [
                        ...parsed,
                        ...missingDefaults.map((item, idx) => ({
                            ...item,
                            order: parsed.length + idx + 1,
                        })),
                    ];
                    localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(merged));
                    return merged;
                }
                return parsed;
            }
        }
    } catch {}
    return DEFAULT_MASTER_MENU_ITEMS;
}

export function saveMasterMenuItems(items: MasterMenuItem[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEYS.MENUS, JSON.stringify(items));
        window.dispatchEvent(new Event("numpux_master_data_updated"));
    } catch {}
}

export function getMasterCategories(): string[] {
    if (typeof window === "undefined") return DEFAULT_MASTER_CATEGORIES.map((c) => c.name);
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Support both array of strings and array of objects
                return parsed.map((item) => (typeof item === "string" ? item : item.name));
            }
        }
    } catch {}
    return DEFAULT_MASTER_CATEGORIES.map((c) => c.name);
}

export function saveMasterCategories(categories: string[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        window.dispatchEvent(new Event("numpux_master_data_updated"));
    } catch {}
}

export function getMasterIssueTypes(): MasterIssueTypeItem[] {
    if (typeof window === "undefined") return DEFAULT_MASTER_ISSUE_TYPES;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.ISSUE_TYPES);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {}
    return DEFAULT_MASTER_ISSUE_TYPES;
}

export function saveMasterIssueTypes(items: MasterIssueTypeItem[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEYS.ISSUE_TYPES, JSON.stringify(items));
        window.dispatchEvent(new Event("numpux_master_data_updated"));
    } catch {}
}

export function getMasterPriorities(): MasterPriorityItem[] {
    if (typeof window === "undefined") return DEFAULT_MASTER_PRIORITIES;
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.PRIORITIES);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch {}
    return DEFAULT_MASTER_PRIORITIES;
}

export function saveMasterPriorities(items: MasterPriorityItem[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEYS.PRIORITIES, JSON.stringify(items));
        window.dispatchEvent(new Event("numpux_master_data_updated"));
    } catch {}
}

export function getIssueTypeConfig(typeId?: string): { icon: any; colorClass: string; name: string } {
    const types = getMasterIssueTypes();
    const found = types.find((t) => t.id.toLowerCase() === (typeId || "task").toLowerCase());
    if (found) {
        return {
            icon: ISSUE_TYPE_ICONS[found.iconName] || CheckSquare,
            colorClass: found.colorClass,
            name: found.name,
        };
    }
    // Fallback defaults
    if (typeId === "Bug") {
        return { icon: Bug, colorClass: "text-rose-500 bg-rose-500/10", name: "Bug" };
    }
    if (typeId === "Story") {
        return { icon: BookmarkSimple, colorClass: "text-emerald-500 bg-emerald-500/10", name: "Story" };
    }
    return { icon: CheckSquare, colorClass: "text-blue-500 bg-blue-500/10", name: "Task" };
}

export function getPriorityConfig(priorityName?: string): { label: string; dotClass: string; badgeClass: string } {
    const priorities = getMasterPriorities();
    const found = priorities.find((p) => p.id.toLowerCase() === (priorityName || "medium").toLowerCase() || p.name.toLowerCase() === (priorityName || "medium").toLowerCase());
    if (found) {
        return {
            label: found.name,
            dotClass: found.dotColor,
            badgeClass: found.badgeClass,
        };
    }
    return {
        label: priorityName || "Medium",
        dotClass: "bg-sky-500",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
    };
}

