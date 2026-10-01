"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Gear, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { SettingsModal } from "@/components/dashboard/settings-modal";

function getPageTitle(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/projects") return "Projects";
  if (pathname === "/monitoring") return "Monitoring";
  if (pathname === "/reports") return "Reports";
  if (pathname === "/notifications") return "Notifications";
  if (pathname.startsWith("/projects/new")) return "New project";
  if (pathname.startsWith("/projects/edit")) return "Edit project";
  if (pathname === "/tasks") return "Tasks";
  if (pathname === "/tasks/kanban") return "Board";
  if (pathname.startsWith("/tasks/new")) return "New task";
  if (pathname.startsWith("/tasks/edit")) return "Edit task";
  if (pathname === "/profile") return "Profile";
  if (pathname.startsWith("/master")) return "Workspace settings";
  return "Numpux";
}

export function GlobalJiraHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const activeProjectId = useSearchParams().get("projectId") || "";
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />
          <span className="h-4 w-px bg-border" />
          <p className="truncate text-sm font-semibold">{getPageTitle(pathname)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCreateModalOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white hover:bg-primary-hover">
            <Plus size={14} weight="bold" />
            <span className="hidden sm:inline">New task</span>
          </button>
          <button title="Workspace settings" onClick={() => setSettingsModalOpen(true)} className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground">
            <Gear size={15} />
          </button>
        </div>
      </header>

      <TaskFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultProjectId={activeProjectId}
        onSuccess={(newTask) => {
          toast.success(`${newTask.key || "Task"} created`);
          setCreateModalOpen(false);
          router.refresh();
        }}
      />
      <SettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </>
  );
}
