"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
    ChevronsUpDown,
    Check,
    Plus,
    Briefcase,
    LayoutDashboard,
    CheckSquare,
    FolderKanban,
    LogOut,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Settings,
    Layers,
    User
} from "lucide-react";
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
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Project } from "@/lib/types";

export function SidebarNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isMobile } = useSidebar();

    const [projects, setProjects] = useState<Project[]>([]);
    const [tasksSubOpen, setTasksSubOpen] = useState(true);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    // Current active projectId from URL query parameter ?projectId=...
    const activeProjectId = searchParams.get("projectId") || "";

    const fetchProjects = () => {
        fetch("/api/projects")
            .then((res) => res.json())
            .then((res) => {
                if (res.data) setProjects(res.data);
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchProjects();
    }, [pathname]);

    const activeProject = projects.find((p) => p.id === activeProjectId);

    const handleSelectProject = (projectId: string) => {
        if (!projectId) {
            // All projects
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
                router.push(`/tasks?projectId=${projectId}`);
            }
            toast.success(`Switched to: ${chosen?.title || "Project"}`);
        }
    };

    const handleLogout = () => {
        toast.success("Successfully logged out!");
        router.push("/login");
    };

    return (
        <>
            {/* Header: Project / Workspace Dropdown Switcher (shadcn style) */}
            <SidebarHeader className="p-2 border-b border-border bg-card">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/80 transition-all text-left outline-none border border-transparent hover:border-border/50 group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center">
                            <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0 shadow-sm font-bold text-sm">
                                {activeProject ? (
                                    activeProject.title.slice(0, 1).toUpperCase()
                                ) : (
                                    <Layers className="w-4 h-4 text-background" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <p className="text-xs font-bold text-foreground truncate leading-tight">
                                    {activeProject ? activeProject.title : "All Projects"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate capitalize">
                                    {activeProject ? (activeProject.category || "Project") : "Workspace"}
                                </p>
                            </div>
                            <ChevronsUpDown className="w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-64 p-1.5 rounded-xl border border-border shadow-lg bg-card"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                            Select Active Project
                        </DropdownMenuLabel>

                        <DropdownMenuItem
                            onClick={() => handleSelectProject("")}
                            className={cn(
                                "flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium",
                                !activeProjectId && "bg-primary/10 text-primary font-semibold"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                                    <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <span>All Projects</span>
                            </div>
                            {!activeProjectId && <Check className="w-4 h-4 text-primary" />}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1 bg-border/60" />

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
                                            <p className="text-[9px] text-muted-foreground">{proj.tasks || 0} Tasks</p>
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
                                <span>Create New Project</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarHeader>

            {/* Middle: Platform Nav & Projects */}
            <SidebarContent className="py-2 px-2 group-data-[collapsible=icon]:px-0 space-y-4 bg-card">
                {/* Platform Group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1 group-data-[collapsible=icon]:hidden">
                        Platform
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {/* Dashboard */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/dashboard"}
                                tooltip="Dashboard"
                                className={cn(
                                    "h-9 px-3 rounded-xl transition-colors",
                                    pathname === "/dashboard"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                <Link href={activeProjectId ? `/dashboard?projectId=${activeProjectId}` : "/dashboard"}>
                                    <LayoutDashboard size={16} />
                                    <span className="text-[13px]">Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {/* Tasks (With collapsible sub-links like Playground) */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setTasksSubOpen(!tasksSubOpen)}
                                isActive={pathname.startsWith("/tasks")}
                                tooltip="Tasks"
                                className={cn(
                                    "h-9 px-3 rounded-xl transition-colors w-full justify-between",
                                    pathname.startsWith("/tasks")
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={16} />
                                    <span className="text-[13px]">Tasks</span>
                                </div>
                                <ChevronRight
                                    size={14}
                                    className={cn(
                                        "transition-transform duration-200 group-data-[collapsible=icon]:hidden text-muted-foreground",
                                        tasksSubOpen && "rotate-90"
                                    )}
                                />
                            </SidebarMenuButton>

                            {tasksSubOpen && (
                                <SidebarMenuSub>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={pathname === "/tasks" && !activeProjectId}
                                        >
                                            <Link href="/tasks">
                                                <span>All Tasks</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={pathname === "/tasks/kanban"}
                                        >
                                            <Link href={activeProjectId ? `/tasks/kanban?projectId=${activeProjectId}` : "/tasks/kanban"}>
                                                <span>Kanban Board</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                    <SidebarMenuSubItem>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={pathname === "/tasks/new"}
                                        >
                                            <Link href={activeProjectId ? `/tasks/new?projectId=${activeProjectId}` : "/tasks/new"}>
                                                <span>New Task</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>

                        {/* Projects */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/projects" || pathname.startsWith("/projects/")}
                                tooltip="All Projects"
                                className={cn(
                                    "h-9 px-3 rounded-xl transition-colors",
                                    pathname === "/projects" || pathname.startsWith("/projects/")
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                )}
                            >
                                <Link href="/projects">
                                    <FolderKanban size={16} />
                                    <span className="text-[13px]">Projects</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer: User Profile Switcher (shadcn style bottom) */}
            <SidebarFooter className="p-2 border-t border-border bg-card">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/80 transition-all text-left outline-none group-data-[collapsible=icon]:p-1 group-data-[collapsible=icon]:justify-center">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                                AN
                            </div>
                            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <p className="text-xs font-semibold text-foreground truncate leading-tight">Admin Numpux</p>
                                <p className="text-[10px] text-muted-foreground truncate">admin@numpux.com</p>
                            </div>
                            <ChevronsUpDown className="w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 p-1.5 rounded-xl border border-border shadow-lg bg-card"
                        align="start"
                        side={isMobile ? "top" : "right"}
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="p-2">
                            <p className="text-xs font-semibold text-foreground">Admin Numpux</p>
                            <p className="text-[10px] text-muted-foreground">admin@numpux.com</p>
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
                            onClick={() => setSettingsModalOpen(true)}
                            className="cursor-pointer text-xs p-2"
                        >
                            <Settings className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-xs p-2 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        >
                            <LogOut className="w-3.5 h-3.5 mr-2" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>

            {/* Profile Dialog */}
            <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">User Profile</DialogTitle>
                        <DialogDescription>
                            Your account information and workspace role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                                AN
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-foreground">Admin Numpux</h4>
                                <p className="text-xs text-muted-foreground">admin@numpux.com</p>
                                <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    Workspace Owner
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-foreground">Display Name</label>
                                <Input defaultValue="Admin Numpux" className="mt-1 text-xs" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Email Address</label>
                                <Input defaultValue="admin@numpux.com" disabled className="mt-1 text-xs bg-muted/50" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-foreground">Organization</label>
                                <Input defaultValue="Numpux Technologies Inc." className="mt-1 text-xs" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProfileModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                toast.success("Profile saved successfully");
                                setProfileModalOpen(false);
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg">Workspace Settings</DialogTitle>
                        <DialogDescription>
                            Configure your preferences, notifications, and security.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                                <div>
                                    <p className="text-xs font-semibold text-foreground">Email Notifications</p>
                                    <p className="text-[11px] text-muted-foreground">Receive daily digest of sprint changes</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded border-border text-primary accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                                <div>
                                    <p className="text-xs font-semibold text-foreground">Compact Sidebar</p>
                                    <p className="text-[11px] text-muted-foreground">Auto collapse sidebar on smaller viewports</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded border-border text-primary accent-primary"
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                                <div>
                                    <p className="text-xs font-semibold text-foreground">Telemetry & Analytics</p>
                                    <p className="text-[11px] text-muted-foreground">Help improve Numpux performance</p>
                                </div>
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="w-4 h-4 rounded border-border text-primary accent-primary"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettingsModalOpen(false)}
                        >
                            Close
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                toast.success("Settings updated");
                                setSettingsModalOpen(false);
                            }}
                        >
                            Save Preferences
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}