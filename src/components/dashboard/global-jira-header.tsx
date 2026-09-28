"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Gear, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { SettingsModal } from "@/components/dashboard/settings-modal";

export function GlobalJiraHeader() {
  const router = useRouter();
  const activeProjectId = useSearchParams().get("projectId") || "";
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-white px-4 sm:px-6">
        <div className="flex items-center">
          <SidebarTrigger className="cursor-pointer rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted" />
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" title="Notifications" onClick={() => toast.info("No unread notifications", { description: "Your workspace is up to date." })} className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Bell size={17} /></button>
          <button type="button" title="Settings" onClick={() => setSettingsModalOpen(true)} className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Gear size={17} /></button>
          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <button type="button" onClick={() => setCreateModalOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#067a4b]"><Plus size={14} /><span className="hidden sm:inline">New task</span></button>
        </div>
      </header>

      <TaskFormModal open={createModalOpen} onOpenChange={setCreateModalOpen} defaultProjectId={activeProjectId} onSuccess={(newTask) => { toast.success(`Created ${newTask.key || "task"} successfully`); setCreateModalOpen(false); router.refresh(); }} />
      <SettingsModal open={settingsModalOpen} onOpenChange={setSettingsModalOpen} />
    </>
  );
}
