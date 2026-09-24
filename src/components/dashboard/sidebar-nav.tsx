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
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
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
import { MasterDataModal } from "@/components/settings/master-data-modal";

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
    master_sections: Rows,
    settings: SlidersHorizontal,
};

export function SidebarNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isMobile } = useSidebar();

    const [projects, setProjects] = useState<Project[]>([]);
    const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role?: "admin" | "user" }>({
        name: "User",
        email: "user@numpux.com",
        role: "user",
    });
    const { menus: dynamicMenus, sections: dynamicSections, fetchMenus } = useNavigationStore();
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [projectSettingsModalOpen, setProjectSettingsModalOpen] = useState(false);

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
                    fetchMenus();
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
            toast.info("Viewing all projects");
        } else {
            const chosen = projects.find((p) => p.id === projectId);
            if (pathname === "/tasks" || pathname === "/tasks/kanban" || pathname === "/dashboard") {
                router.push(`${pathname}?projectId=${projectId}`);
            } else {
                router.push(`/tasks/kanban?projectId=${projectId}`);
            }
            toast.success(`Switched to: ${chosen?.title || "Project"}`);
        }
    };

    const handleLogout = async () => {
        try {
            await apiFetch("/api/auth/me", { method: "POST" });
        } catch {
            // Ignore failure and continue redirect
        }
        toast.success("Successfully logged out!");
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
            {/* Header: Project Context Switcher (Jira Project sidebar header) */}
            <SidebarHeader className="h-14 border-b border-border bg-card px-3 py-0 flex flex-row items-center justify-between">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-muted/80 transition-all text-left outline-none border border-transparent hover:border-border/50 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center">
                            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                                {activeProject ? (
                                    activeProject.title.slice(0, 1).toUpperCase()
                                ) : (
                                    <Stack className="w-4 h-4 text-primary-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <p className="text-xs font-bold text-foreground truncate leading-tight">
                                    {activeProject ? activeProject.title : "All Projects"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-semibold">
                                    {activeProject ? (activeProject.category || "Software Project") : "Workspace"}
                                </p>
                            </div>
                            <CaretUpDown className="w-3.5 h-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-64 p-1.5 rounded-xl border border-border shadow-lg bg-card"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                            Recent Projects
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
                                        <span>All Projects</span>
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
                                            <p className="text-[9px] text-muted-foreground">{proj.tasks || 0} Issues</p>
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
                                <span>Create Project</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarHeader>

            {/* Dynamic Navigation Links from Database */}
            <SidebarContent className="py-2 px-2 group-data-[collapsible=icon]:px-0 space-y-4 bg-card">
                {dynamicSections.map((sectionName) => {
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
                            <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-3 mb-1 group-data-[collapsible=icon]:hidden">
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
                                    const IconComponent = MENU_ICONS[item.icon || ""] || MENU_ICONS[item.code] || SquaresFour;

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
                                                                "h-9 px-3 rounded-xl transition-colors cursor-pointer w-full justify-between",
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
                                                    "h-9 px-3 rounded-xl transition-colors",
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

            {/* Footer: User Profile */}
            <SidebarFooter className="p-2 border-t border-border bg-card">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/80 transition-all text-left outline-none group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
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
                        className="w-56 p-1.5 rounded-xl border border-border shadow-lg bg-card"
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
                            Profile Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => router.push("/master/menus")}
                            className="cursor-pointer text-xs p-2 flex items-center justify-between"
                        >
                            <div className="flex items-center">
                                <SlidersHorizontal className="w-3.5 h-3.5 mr-2 text-primary" />
                                <span>Master Settings</span>
                            </div>
                            <span className="text-[9px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/20">
                                Settings
                            </span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setSettingsModalOpen(true)}
                            className="cursor-pointer text-xs p-2"
                        >
                            <Gear className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-xs p-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        >
                            <SignOut className="w-3.5 h-3.5 mr-2" />
                            Sign Out
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

            {/* Project & Issue Configuration Modal */}
            <MasterDataModal
                open={projectSettingsModalOpen}
                onOpenChange={setProjectSettingsModalOpen}
            />
        </>
    );
}