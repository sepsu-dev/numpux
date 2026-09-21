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
    MoreHorizontal,
    Hash,
    Layers
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
import type { Project } from "@/lib/types";

export function SidebarNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isMobile } = useSidebar();

    const [projects, setProjects] = useState<Project[]>([]);
    const [tasksSubOpen, setTasksSubOpen] = useState(true);

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
            if (pathname === "/tasks" || pathname === "/tasks/kanban") {
                router.push(pathname);
            } else {
                router.push("/tasks");
            }
            toast.info("Menampilkan semua proyek");
        } else {
            const chosen = projects.find((p) => p.id === projectId);
            if (pathname === "/tasks" || pathname === "/tasks/kanban") {
                router.push(`${pathname}?projectId=${projectId}`);
            } else {
                router.push(`/tasks?projectId=${projectId}`);
            }
            toast.success(`Beralih ke proyek: ${chosen?.title || "Proyek"}`);
        }
    };

    const handleLogout = () => {
        toast.success("Berhasil keluar!");
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
                                    {activeProject ? activeProject.title : "Semua Proyek"}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate capitalize">
                                    {activeProject ? (activeProject.category || "Proyek") : "Workspace"}
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
                            Pilih Proyek Aktif
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
                                <span>Semua Proyek</span>
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
                                            <p className="text-[9px] text-muted-foreground">{proj.tasks || 0} Tugas</p>
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
                                <span>Tambah Proyek Baru</span>
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
                        {/* Beranda */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/dashboard"}
                                tooltip="Beranda"
                                className={cn(
                                    "h-9 px-3 rounded-xl transition-colors",
                                    pathname === "/dashboard"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Link href="/dashboard">
                                    <LayoutDashboard size={16} />
                                    <span className="text-[13px]">Beranda</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        {/* Tugas (With collapsible sub-links like Playground) */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setTasksSubOpen(!tasksSubOpen)}
                                isActive={pathname.startsWith("/tasks")}
                                tooltip="Tugas"
                                className={cn(
                                    "h-9 px-3 rounded-xl transition-colors w-full justify-between",
                                    pathname.startsWith("/tasks")
                                        ? "text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={16} />
                                    <span className="text-[13px]">Tugas</span>
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
                                                <span>Semua Tugas</span>
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
                                                <span>Tambah Tugas</span>
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                </SidebarMenuSub>
                            )}
                        </SidebarMenuItem>

                        {/* Proyek */}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === "/projects" || pathname.startsWith("/projects/")}
                                tooltip="Semua Proyek"
                                className={cn(
                                    "h-9 px-3 rounded-xl transition-colors",
                                    pathname === "/projects" || pathname.startsWith("/projects/")
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <Link href="/projects">
                                    <FolderKanban size={16} />
                                    <span className="text-[13px]">Semua Proyek</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Projects Section */}
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1">
                        Projects
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {projects.slice(0, 5).map((project) => {
                            const isCurrent = activeProjectId === project.id;
                            return (
                                <SidebarMenuItem key={project.id}>
                                    <SidebarMenuButton
                                        onClick={() => handleSelectProject(project.id)}
                                        isActive={isCurrent}
                                        className={cn(
                                            "h-8 px-3 rounded-lg text-xs transition-colors",
                                            isCurrent
                                                ? "bg-primary/10 text-primary font-semibold"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <Hash size={13} className="shrink-0 text-muted-foreground" />
                                        <span className="truncate">{project.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            );
                        })}

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild className="h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                                <Link href="/projects" className="flex items-center gap-2">
                                    <MoreHorizontal size={13} />
                                    <span>Lihat Semua Proyek</span>
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
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
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
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="cursor-pointer text-xs p-2">
                                <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                                Dashboard
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1 bg-border/60" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-xs p-2 text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut className="w-3.5 h-3.5 mr-2" />
                            Keluar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </>
    );
}