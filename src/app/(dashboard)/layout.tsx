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
            <div className="flex min-h-screen w-full bg-[#f7f8f5] font-sans text-foreground">
                <Sidebar collapsible="icon" className="border-r border-border bg-[#fbfcf9]">
                    <Suspense fallback={<div className="p-4 text-xs text-muted-foreground animate-pulse">Loading navigation...</div>}>
                        <SidebarNav />
                    </Suspense>
                </Sidebar>

                <SidebarInset className="flex min-w-0 flex-1 flex-col bg-[#f7f8f5]">
                    <Suspense fallback={<div className="h-16 animate-pulse border-b border-border bg-white" />}>
                        <GlobalJiraHeader />
                    </Suspense>

                    <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
                        {children}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
