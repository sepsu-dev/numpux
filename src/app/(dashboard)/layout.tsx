import { Suspense } from "react";
import {
    Sidebar,
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { GlobalJiraHeader } from "@/components/dashboard/global-jira-header";
import { MonitoringHeartbeat } from "@/components/dashboard/monitoring-heartbeat";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <MonitoringHeartbeat />
            <div className="flex min-h-screen w-full bg-background text-foreground">
                <Sidebar collapsible="icon" className="border-r border-border bg-white">
                    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading navigation…</div>}>
                        <SidebarNav />
                    </Suspense>
                </Sidebar>

                <SidebarInset className="flex min-w-0 flex-1 flex-col bg-background">
                    <Suspense fallback={<div className="h-14 border-b border-border bg-white" />}>
                        <GlobalJiraHeader />
                    </Suspense>

                    <div className="mx-auto w-full max-w-[1360px] p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
