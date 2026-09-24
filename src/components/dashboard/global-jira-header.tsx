"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Bell,
    Gear,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { Project } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { SettingsModal } from "@/components/dashboard/settings-modal";

export function GlobalJiraHeader() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeProjectId = searchParams.get("projectId") || "";

    const [projects, setProjects] = useState<Project[]>([]);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    const fetchProjects = () => {
        apiFetch("/api/projects")
            .then((r) => r.json())
            .then((res) => {
                if (res.data) setProjects(res.data);
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchProjects();
    }, [pathname]);

    return (
        <>
            <header className="h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-30 gap-3">
                {/* Left: Sidebar trigger */}
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="text-muted-foreground hover:bg-muted transition-colors rounded-lg p-1.5 cursor-pointer" />
                </div>

                {/* Right: Notifications, Settings */}
                <div className="flex items-center gap-2">
                    <button
                        title="Notifications"
                        onClick={() =>
                            toast.info("No unread notifications", {
                                description: "You are all caught up across your sprint deliverables.",
                            })
                        }
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        <Bell size={16} />
                    </button>

                    <button
                        title="Settings"
                        onClick={() => setSettingsModalOpen(true)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                        <Gear size={16} />
                    </button>
                </div>
            </header>

            {/* Global Task Creation Modal */}
            <TaskFormModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                defaultProjectId={activeProjectId}
                onSuccess={(newTask) => {
                    toast.success(`Created ${newTask.key || "issue"} successfully!`);
                    setCreateModalOpen(false);
                    router.refresh();
                }}
            />

            {/* Account Settings Modal */}
            <SettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
        </>
    );
}
