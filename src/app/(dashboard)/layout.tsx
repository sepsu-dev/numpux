import { Suspense } from "react";
import {
    Sidebar,
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { GlobalJiraHeader } from "@/components/dashboard/global-jira-header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background font-sans text-foreground">
                <Sidebar collapsible="icon" className="border-r border-border bg-card">
                    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading navigation...</div>}>
                        <SidebarNav />
                    </Suspense>
                </Sidebar>

                <SidebarInset className="flex-1 flex flex-col min-w-0 bg-background">
                    {/* Jira-style Global Top Bar */}
                    <Suspense fallback={<div className="h-14 border-b border-border bg-card/80 animate-pulse" />}>
                        <GlobalJiraHeader />
                    </Suspense>

                    <div className="p-6 max-w-[1440px] mx-auto w-full">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}