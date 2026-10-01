"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
    CaretUpDown,
    Check,
    Plus,
    SquaresFour,
    ListDashes,
    FolderSimple,
    SignOut,
    Gear,
    Stack,
    User,
    ChartLineUp,
    SlidersHorizontal,
    ListNumbers,
    ShieldCheck,
    UsersThree,
    Tag,
    CheckSquare,
    Flag,
    CaretRight,
    Rows,
    Columns,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Project, MasterMenu } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { useNavigationStore } from "@/stores/navigation-store";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";
import { MENU_ICONS as DATABASE_MENU_ICONS } from "@/lib/menu-icons";

const MENU_ICONS: Record<string, any> = {
    SquaresFour,
    ListDashes,
    ChartLineUp,
    FolderSimple,
    SlidersHorizontal,
    Gear,
    User,
    Stack,
    ListNumbers,
    ShieldCheck,
    UsersThree,
    Tag,
    CheckSquare,
    Flag,
    Rows,
    Columns,
    board: SquaresFour,
    backlog: ListDashes,
    summary: ChartLineUp,
    projects: FolderSimple,
    master_menus: ListNumbers,
    user_privileges: ShieldCheck,
    project_privileges: UsersThree,
    categories: Tag,
    issue_types: CheckSquare,
    priorities: Flag,
    statuses: Columns,
    project_statuses: Columns,
    master_sections: Rows,
    settings: SlidersHorizontal,
};

function SidebarNavigationSkeleton() {
    return (
        <div role="status" aria-label="Loading navigation" className="space-y-5 py-1">
            {[3, 4].map((itemCount, sectionIndex) => (
                <SidebarGroup key={itemCount} className="p-0">
                    <div className="mb-2 px-3 group-data-[collapsible=icon]:hidden">
                        <Skeleton className={cn("h-2.5", sectionIndex === 0 ? "w-14" : "w-20")} />
                    </div>
                    <SidebarMenu className="gap-1">
                        {Array.from({ length: itemCount }).map((_, itemIndex) => (
                            <SidebarMenuItem key={itemIndex}>
                                <div className="flex h-9 items-center gap-2.5 rounded-md px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                                    <Skeleton className="h-4 w-4 shrink-0 rounded" />
                                    <Skeleton
                                        className={cn(
                                            "h-3 group-data-[collapsible=icon]:hidden",
                                            itemIndex % 3 === 0 ? "w-24" : itemIndex % 2 === 0 ? "w-20" : "w-16"
                                        )}
                                    />
                                </div>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
            <span className="sr-only">Loading navigation menu…</span>
        </div>
    );
}

export function SidebarNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isMobile } = useSidebar();

    const [projects, setProjects] = useState<Project[]>([]);
    const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: "superadmin" | "admin" | "user" }>({
        name: "User",
        email: "user@numpux.com",
        role: "user",
    });
    const {
        menus: dynamicMenus,
        sections: dynamicSections,
        isLoading: isNavigationLoading,
        error: navigationError,
        fetchMenus,
    } = useNavigationStore();
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    // Current active projectId from URL query parameter ?projectId=...
    const activeProjectId = searchParams.get("projectId") || "";

    const fetchProjects = () => {
        apiFetch("/api/projects")
            .then((res) => res.json())
            .then((res) => {
                if (res.data) setProjects(res.data);
            })
            .catch(() => { });
    };

    const fetchUserAndPrivileges = () => {
        fetchMenus();
        apiFetch("/api/auth/me")
            .then((res) => res.json())
            .then((res) => {
                if (res.data && res.data.name) {
                    const role = res.data.role || "user";
                    setCurrentUser({ name: res.data.name, email: res.data.email, role });
                }
            })
            .catch(() => { });
    };

    useEffect(() => {
        fetchProjects();
        fetchUserAndPrivileges();

        const handleMasterUpdate = () => {
            fetchProjects();
            fetchUserAndPrivileges();
        };
        window.addEventListener("numpux_master_data_updated", handleMasterUpdate);
        return () => window.removeEventListener("numpux_master_data_updated", handleMasterUpdate);
    }, [pathname]);

    // If user has only 1 project, auto-select it as effective project
    const hasSingleProject = projects.length === 1;
    const effectiveProjectId = activeProjectId || (hasSingleProject ? projects[0].id : "");
    const activeProject = projects.find((p) => p.id === effectiveProjectId);

    const handleSelectProject = (projectId: string) => {
        if (!projectId) {
            if (pathname === "/tasks" || pathname === "/tasks/kanban" || pathname === "/dashboard") {
                router.push(pathname);
            } else {
                router.push("/tasks");
            }
            toast.info("Showing all projects");
        } else {
            const chosen = projects.find((p) => p.id === projectId);
            if (pathname === "/tasks" || pathname === "/tasks/kanban" || pathname === "/dashboard") {
                router.push(`${pathname}?projectId=${projectId}`);
            } else {
                router.push(`/tasks/kanban?projectId=${projectId}`);
            }
            toast.success(`Project changed to ${chosen?.title || "Project"}`);
        }
    };

    const handleLogout = async () => {
        try {
            await apiFetch("/api/auth/me", { method: "POST" });
        } catch {
            // Ignore failure and continue redirect
        }
        toast.success("Signed out");
        router.push("/login");
    };

    // Helper links with project context
    const boardHref = effectiveProjectId ? `/tasks/kanban?projectId=${effectiveProjectId}` : "/tasks/kanban";
    const backlogHref = effectiveProjectId ? `/tasks?projectId=${effectiveProjectId}` : "/tasks";
    const summaryHref = effectiveProjectId ? `/dashboard?projectId=${effectiveProjectId}` : "/dashboard";

    const isBoardActive = pathname === "/tasks/kanban";
    const isBacklogActive = pathname === "/tasks" && !isBoardActive;
    const isSummaryActive = pathname === "/dashboard";
    const isProjectsActive = pathname === "/projects" || pathname.startsWith("/projects/");
    const isSettingsActive = pathname === "/master";

    return (
        <>
            <SidebarHeader className="flex h-14 flex-row items-center justify-between border-b border-border bg-white px-2 py-0">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                                {activeProject ? (
                                    activeProject.title.slice(0, 1).toUpperCase()
                                ) : (
                                    <Stack className="w-4 h-4 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <p className="truncate text-xs font-semibold leading-tight text-foreground">
                                    {activeProject ? activeProject.title : "All projects"}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                    {activeProject ? (activeProject.category || "Project") : "Numpux workspace"}
                                </p>
                            </div>
                            <CaretUpDown className="w-3.5 h-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-64 rounded-md border border-border bg-white p-1.5"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Projects
                        </DropdownMenuLabel>

                        {!hasSingleProject && (
                            <>
                                <DropdownMenuItem
                                    onClick={() => handleSelectProject("")}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium",
                                        !effectiveProjectId && "bg-primary/10 text-primary font-semibold"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                                            <Stack className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <span>All projects</span>
                                    </div>
                                    {!effectiveProjectId && <Check className="w-4 h-4 text-primary" />}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-border/60" />
                            </>
                        )}

                        <div className="max-h-56 overflow-y-auto space-y-0.5">
                            {projects.map((proj) => (
                                <DropdownMenuItem
                                    key={proj.id}
                                    onClick={() => handleSelectProject(proj.id)}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium",
                                        activeProjectId === proj.id && "bg-primary/10 text-primary font-semibold"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                                            {proj.title.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate">{proj.title}</p>
                                            <p className="text-[9px] text-muted-foreground">{proj.tasks || 0} tasks</p>
                                        </div>
                                    </div>
                                    {activeProjectId === proj.id && (
                                        <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className="my-1 bg-border/60" />

                        <DropdownMenuItem asChild>
                            <Link
                                href="/projects/new"
                                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-medium text-foreground hover:bg-muted"
                            >
                                <div className="w-6 h-6 rounded-md border border-dashed border-border flex items-center justify-center">
                                    <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <span>Create project</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarHeader>

            <SidebarContent
                aria-busy={isNavigationLoading}
                className="space-y-4 bg-white px-2 py-3 group-data-[collapsible=icon]:px-0"
            >
                {isNavigationLoading && dynamicMenus.length === 0 ? (
                    <SidebarNavigationSkeleton />
                ) : navigationError && dynamicMenus.length === 0 ? (
                    <div className="mx-2 rounded-md border border-border bg-muted/35 px-3 py-3 group-data-[collapsible=icon]:mx-1 group-data-[collapsible=icon]:px-1.5">
                        <p className="text-[11px] leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
                            Navigation could not be loaded.
                        </p>
                        <button
                            type="button"
                            onClick={() => fetchMenus()}
                            className="mt-2 text-[11px] font-semibold text-primary hover:underline group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:text-[9px]"
                        >
                            Retry
                        </button>
                    </div>
                ) : dynamicSections.map((sectionName) => {
                    const sectionMenus = dynamicMenus.filter(
                        (m) => (m.section || "Planning").toLowerCase() === sectionName.toLowerCase()
                    );
                    if (sectionMenus.length === 0) return null;

                    // Separate top-level items and submenus
                    const topLevelMenus = sectionMenus.filter((m) => !m.parentId);
                    const subMenuMap = new Map<string, MasterMenu[]>();
                    sectionMenus
                        .filter((m) => !!m.parentId)
                        .forEach((m) => {
                            const list = subMenuMap.get(m.parentId!) || [];
                            list.push(m);
                            subMenuMap.set(m.parentId!, list);
                        });

                    return (
                        <SidebarGroup key={sectionName}>
                            <SidebarGroupLabel className="mb-1 px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground group-data-[collapsible=icon]:hidden">
                                {sectionName}
                            </SidebarGroupLabel>
                            <SidebarMenu>
                                {topLevelMenus.map((item) => {
                                    const subItems = subMenuMap.get(item.id) || [];
                                    const hasSubItems = subItems.length > 0;

                                    // Parse item path and query params for active state detection
                                    const [itemPath, itemQuery] = item.path.split("?");
                                    const currentTab = searchParams.get("tab");
                                    const itemTab = itemQuery ? new URLSearchParams(itemQuery).get("tab") : null;

                                    let isItemActive = false;
                                    if (itemTab) {
                                        isItemActive = pathname === itemPath && (currentTab === itemTab || (!currentTab && itemTab === "menus"));
                                    } else {
                                        isItemActive =
                                            pathname === itemPath ||
                                            (itemPath !== "/" && pathname.startsWith(itemPath) && itemPath !== "/tasks");
                                    }

                                    const isSubActive = subItems.some((sub) => {
                                        const [subPath] = sub.path.split("?");
                                        return pathname === subPath || (subPath !== "/" && pathname.startsWith(subPath));
                                    });

                                    // Build dynamic href preserving project context for planning items
                                    let href = item.path;
                                    if (
                                        effectiveProjectId &&
                                        (item.path === "/tasks/kanban" || item.path === "/tasks" || item.path === "/dashboard")
                                    ) {
                                        href = `${item.path}?projectId=${effectiveProjectId}`;
                                    }

                                    // Resolve icon
                                    const IconComponent = DATABASE_MENU_ICONS[item.icon || ""] || MENU_ICONS[item.code] || SquaresFour;

                                    if (hasSubItems) {
                                        return (
                                            <Collapsible
                                                key={item.id || item.code}
                                                asChild
                                                defaultOpen={isItemActive || isSubActive}
                                                className="group/collapsible"
                                            >
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton
                                                            tooltip={item.name}
                                                            className={cn(
                                                                "h-9 w-full justify-between rounded-md px-3 transition-colors cursor-pointer",
                                                                (isItemActive || isSubActive)
                                                                    ? "bg-primary/10 text-primary font-semibold"
                                                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <IconComponent size={16} weight={isItemActive || isSubActive ? "bold" : "regular"} />
                                                                <span className="text-[13px]">{item.name}</span>
                                                            </div>
                                                            <CaretRight
                                                                size={13}
                                                                className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/70"
                                                            />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub className="my-1 ml-4 border-l border-border/60 pl-2 space-y-0.5">
                                                            {subItems.map((sub) => {
                                                                const [subPath, subQuery] = sub.path.split("?");
                                                                let subIsActive = false;
                                                                if (subQuery) {
                                                                    const subTab = new URLSearchParams(subQuery).get("tab");
                                                                    subIsActive = pathname === subPath && currentTab === subTab;
                                                                } else {
                                                                    subIsActive = pathname === subPath || (subPath !== "/" && pathname.startsWith(subPath));
                                                                }

                                                                let subHref = sub.path;
                                                                if (
                                                                    effectiveProjectId &&
                                                                    (sub.path === "/tasks/kanban" || sub.path === "/tasks" || sub.path === "/dashboard")
                                                                ) {
                                                                    subHref = `${sub.path}?projectId=${effectiveProjectId}`;
                                                                }

                                                                return (
                                                                    <SidebarMenuSubItem key={sub.id || sub.code}>
                                                                        <SidebarMenuSubButton
                                                                            asChild
                                                                            isActive={subIsActive}
                                                                            className={cn(
                                                                                "h-8 px-2.5 rounded-lg text-xs transition-colors",
                                                                                subIsActive
                                                                                    ? "bg-primary/15 text-primary font-semibold"
                                                                                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                                                            )}
                                                                        >
                                                                            <Link href={subHref}>
                                                                                <span>{sub.name}</span>
                                                                            </Link>
                                                                        </SidebarMenuSubButton>
                                                                    </SidebarMenuSubItem>
                                                                );
                                                            })}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        );
                                    }

                                    return (
                                        <SidebarMenuItem key={item.id || item.code}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isItemActive}
                                                tooltip={item.name}
                                                className={cn(
                                                    "h-9 rounded-md px-3 transition-colors",
                                                    isItemActive
                                                        ? "bg-primary/10 text-primary font-semibold"
                                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                                )}
                                            >
                                                <Link href={href}>
                                                    <IconComponent size={16} weight={isItemActive ? "bold" : "regular"} />
                                                    <span className="text-[13px]">{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroup>
                    );
                })}
            </SidebarContent>

            <SidebarFooter className="border-t border-border bg-white p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-3 rounded-md p-2 text-left outline-none hover:bg-muted group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-semibold text-foreground">
                                {currentUser.name
                                    ? currentUser.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
                                    : "U"}
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <p className="text-xs font-semibold text-foreground truncate leading-tight">{currentUser.name}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
                            </div>
                            <CaretUpDown className="w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 rounded-md border border-border bg-white p-1.5"
                        align="start"
                        side={isMobile ? "top" : "right"}
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="p-2">
                            <p className="text-xs font-semibold text-foreground">{currentUser.name}</p>
                            <p className="text-[10px] text-muted-foreground">{currentUser.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem
                            onClick={() => setProfileModalOpen(true)}
                            className="cursor-pointer text-xs p-2"
                        >
                            <User className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => router.push("/master/menus")}
                            className="cursor-pointer text-xs p-2 flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-primary" />
                                <span>Workspace setup</span>
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/20">
                                Admin
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setSettingsModalOpen(true)}
                            className="cursor-pointer text-xs p-2"
                        >
                            <Gear className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            Preferences
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer p-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <SignOut className="w-3.5 h-3.5 mr-2" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>

            {/* Profile Modal */}
            <ProfileModal
                open={profileModalOpen}
                onOpenChange={setProfileModalOpen}
                currentUser={currentUser}
                onUserUpdated={(u) => setCurrentUser(u)}
            />

            {/* Account Settings Modal */}
            <SettingsModal
                open={settingsModalOpen}
                onOpenChange={setSettingsModalOpen}
            />

        </>
    );
}
