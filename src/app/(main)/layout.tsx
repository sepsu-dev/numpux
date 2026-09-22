"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import {
    ChevronRight,
    Plus,
    Briefcase,
    Bell,
    Settings,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
    Sidebar,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
                <Sidebar collapsible="icon" className="border-r border-border bg-card">
                    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading navigation...</div>}>
                        <SidebarNav />
                    </Suspense>
                </Sidebar>

                <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Top bar */}
                    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
                        <div className="flex items-center gap-3 flex-1">
                            <SidebarTrigger className="text-muted-foreground hover:bg-muted transition-colors rounded-lg p-1.5 cursor-pointer" />
                        </div>

                         <div className="flex items-center gap-2">
                            <button
                                title="Notifications"
                                onClick={() => toast.info("No unread notifications", { description: "You are all caught up across your sprint deliverables." })}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <Bell size={16} />
                            </button>
                            <button
                                title="Settings"
                                onClick={() => toast.info("Workspace Settings", { description: "Access account and team preferences from the bottom profile menu." })}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            >
                                <Settings size={16} />
                            </button>
 
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all cursor-pointer ml-1">
                                        <Plus size={16} />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border border-border shadow-sm bg-card">
                                    <DropdownMenuItem asChild>
                                        <Link href="/tasks/new" className="flex items-center gap-2.5 py-2.5 px-3 cursor-pointer rounded-xl hover:bg-muted">
                                            <Plus size={14} className="text-primary" />
                                            <span className="text-sm font-semibold">New Task</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/projects/new" className="flex items-center gap-2.5 py-2.5 px-3 cursor-pointer rounded-xl hover:bg-muted">
                                            <Briefcase size={14} />
                                            <span className="text-sm font-semibold">New Project</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    <div className="p-6 max-w-[1440px] mx-auto w-full">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}