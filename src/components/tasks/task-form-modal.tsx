"use client";

import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Briefcase, CaretDown, Check, User as UserIcon, CheckSquare } from "@phosphor-icons/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Task, Project, Priority, TaskStatus, ProjectMember, IssueType } from "@/types";
import { apiFetch } from "@/lib/api-client";
import {
    ISSUE_TYPE_ICONS,
} from "@/lib/master-data";
import { useMasterDataStore } from "@/stores/master-data-store";

interface TaskFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task?: Task | null; // If provided, edit mode. Otherwise, create mode.
    defaultProjectId?: string;
    defaultStatus?: TaskStatus;
    onSuccess: (task: Task, isEdit: boolean) => void;
}

export function TaskFormModal({
    open,
    onOpenChange,
    task,
    defaultProjectId,
    defaultStatus,
    onSuccess,
}: TaskFormModalProps) {
    const isEdit = !!task;

    const { issueTypes: masterIssueTypes, priorities: masterPriorities, statuses: masterStatuses, loadAll } = useMasterDataStore();

    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
    const [assigneeId, setAssigneeId] = useState<string>("");
    const [issueType, setIssueType] = useState<string>("");
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState<string>("");
    const [status, setStatus] = useState<TaskStatus>("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load master issue types & priorities when modal is opened
    useEffect(() => {
        if (!open) return;
        void loadAll();
    }, [open, loadAll]);

    // Fetch projects and current user when opened
    useEffect(() => {
        if (!open) return;
        apiFetch("/api/auth/me")
            .then((r) => r.json())
            .then((res) => {
                if (res.data) {
                    setCurrentUser({
                        id: res.data.userId || res.data.id,
                        name: res.data.name,
                        email: res.data.email,
                    });
                }
            })
            .catch(() => {});

        apiFetch("/api/projects")
            .then((r) => r.json())
            .then((res) => {
                if (res.data) {
                    setProjects(res.data);
                    if (!task) {
                        if (defaultProjectId) {
                            setSelectedProjectId(defaultProjectId);
                        } else if (res.data.length === 1) {
                            setSelectedProjectId(res.data[0].id);
                        }
                    }
                }
            })
            .catch(() => {});
    }, [open, defaultProjectId, task]);

    // Fetch members whenever project changes
    useEffect(() => {
        if (!selectedProjectId) {
            setProjectMembers([]);
            return;
        }
        apiFetch(`/api/projects/${selectedProjectId}/members`)
            .then(async (response) => {
                const body = await response.json();
                if (!response.ok) throw new Error(body.message || "Failed to load project members");
                return body;
            })
            .then((body) => {
                setProjectMembers(Array.isArray(body.data?.members) ? body.data.members : []);
            })
            .catch(() => setProjectMembers([]));
    }, [selectedProjectId]);

    // Populate fields when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title || "");
            setSelectedProjectId(task.projectId || "");
            setAssigneeId(task.assigneeId || "");
            setIssueType(task.issueType || masterIssueTypes[0]?.id || "");
            setPriority(task.priority || masterPriorities[0]?.id || "");
            setStatus(task.status || masterStatuses[0]?.id || "");
            setDate(task.date || "");
            setDescription(task.description || "");
        } else {
            setTitle("");
            setSelectedProjectId(defaultProjectId || "");
            setAssigneeId("");
            setIssueType(masterIssueTypes[0]?.id || "");
            setPriority(masterPriorities[0]?.id || "");
            setStatus(defaultStatus || masterStatuses[0]?.id || "");
            setDate("");
            setDescription("");
        }
    }, [task, open, defaultProjectId, defaultStatus, masterIssueTypes, masterPriorities, masterStatuses]);

    const activeProject = projects.find((p) => p.id === selectedProjectId);
    const activeAssignee =
        projectMembers.find((m) => m.userId === assigneeId) ||
        (currentUser && currentUser.id === assigneeId
            ? { userId: currentUser.id, name: `${currentUser.name} (You)`, email: currentUser.email, role: "Owner" as const, id: currentUser.id, projectId: selectedProjectId }
            : null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Task title is required");
            return;
        }

        if (!selectedProjectId) {
            toast.error("Please select a project");
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = isEdit ? `/api/tasks/${task.id}` : "/api/tasks";
            const method = isEdit ? "PUT" : "POST";

            const payload: any = {
                title: title.trim(),
                projectId: selectedProjectId,
                project: activeProject ? activeProject.title : (task?.project || "Project"),
                priority,
                status,
                issueType,
                date: date || undefined,
                description: description.trim() || undefined,
                assigneeId: assigneeId || null,
            };

            const res = await apiFetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to ${isEdit ? "update" : "create"} task`);
            }

            const resData = await res.json();
            const savedTask = resData.data || { ...payload, id: task?.id || Date.now().toString() };

            toast.success(isEdit ? "Task updated successfully" : "Task created successfully");
            onSuccess(savedTask, isEdit);
            onOpenChange(false);
        } catch (err: any) {
            toast.error(err.message || "Failed to save task");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-lg w-full p-0 flex flex-col h-full bg-card border-l border-border shadow-none">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border/60">
                        <SheetHeader className="p-0">
                            <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                {isEdit ? "Edit task" : "New task"}
                            </SheetTitle>
                            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                {isEdit
                                    ? "Update task details, schedule, or project assignment."
                                    : "Add a task with the details needed to start work."}
                            </SheetDescription>
                        </SheetHeader>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">Task type</Label>
                            <div className="flex flex-wrap items-center gap-2">
                                {masterIssueTypes.map((t) => {
                                    const Icon = ISSUE_TYPE_ICONS[t.iconName] || CheckSquare;
                                    const isSelected = issueType === t.id;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setIssueType(t.id)}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer",
                                                isSelected
                                                    ? cn("border-transparent shadow-none ring-1 ring-border/80", t.colorClass)
                                                    : "bg-white border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                            )}
                                        >
                                            <Icon size={14} weight={isSelected ? "bold" : "regular"} />
                                            <span>{t.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Title */}
                        <div className="space-y-1.5">
                            <Label htmlFor="task-modal-title" className="text-xs font-semibold text-foreground">
                                Task title <span className="text-primary">*</span>
                            </Label>
                            <Input
                                id="task-modal-title"
                                placeholder="e.g. Implement payment webhook callback"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-10 text-xs rounded-lg bg-white border-border focus:border-primary transition-colors font-medium"
                                autoFocus
                                required
                            />
                        </div>

                        {/* Project (Full Width) */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">
                                Project <span className="text-primary">*</span>
                            </Label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "h-10 w-full flex items-center justify-between rounded-lg border px-3 bg-white hover:bg-background transition-colors text-xs font-medium cursor-pointer shadow-none",
                                            !selectedProjectId ? "border-amber-300 text-muted-foreground" : "border-border text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <Briefcase size={14} className={activeProject ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
                                            <span className="truncate">
                                                {activeProject ? activeProject.title : "Select a project"}
                                            </span>
                                        </div>
                                        <CaretDown size={13} className="text-muted-foreground opacity-70 shrink-0 ml-2" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[280px] max-h-60 overflow-y-auto p-1 text-xs">
                                    {projects.length === 0 ? (
                                        <div className="p-2 text-center text-muted-foreground text-[11px]">
                                            No projects found
                                        </div>
                                    ) : (
                                        projects.map((p) => (
                                            <DropdownMenuItem
                                                key={p.id}
                                                onClick={() => setSelectedProjectId(p.id)}
                                                className="flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 truncate pr-2">
                                                    <span className="font-medium text-foreground">{p.title}</span>
                                                    {p.category && (
                                                        <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/40 shrink-0">
                                                            {p.category}
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedProjectId === p.id && <Check size={13} className="text-primary shrink-0" />}
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Assignee & Due Date (Side by side on sm) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Assignee */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-foreground">
                                        Assignee
                                    </Label>
                                    {currentUser && (
                                        <button
                                            type="button"
                                            onClick={() => setAssigneeId(currentUser.id)}
                                            className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                                        >
                                            Assign to me
                                        </button>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button
                                            type="button"
                                            className="h-10 w-full flex items-center justify-between rounded-lg border border-border px-3 bg-white hover:bg-background transition-colors text-xs font-medium cursor-pointer shadow-none text-foreground"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                    {activeAssignee ? activeAssignee.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
                                                </div>
                                                <span className="truncate">
                                                    {activeAssignee ? activeAssignee.name : "Unassigned"}
                                                </span>
                                            </div>
                                            <CaretDown size={13} className="text-muted-foreground opacity-70 shrink-0" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 p-1 text-xs">
                                        <DropdownMenuItem
                                            onClick={() => setAssigneeId("")}
                                            className="flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-lg text-muted-foreground"
                                        >
                                            <span>Unassigned</span>
                                            {!assigneeId && <Check size={13} className="text-primary shrink-0" />}
                                        </DropdownMenuItem>

                                        {/* Current User Quick Option (Assign to Me) */}
                                        {currentUser && (
                                            <DropdownMenuItem
                                                onClick={() => setAssigneeId(currentUser.id)}
                                                className="flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-lg bg-primary/5 text-primary font-semibold"
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                        {currentUser.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="truncate">{currentUser.name} (You)</p>
                                                        <p className="text-[10px] text-muted-foreground truncate">{currentUser.email}</p>
                                                    </div>
                                                </div>
                                                {assigneeId === currentUser.id && <Check size={13} className="text-primary shrink-0" />}
                                            </DropdownMenuItem>
                                        )}

                                        {/* Project Members (excluding currentUser if already rendered above) */}
                                        {projectMembers
                                            .filter((m) => !currentUser || m.userId !== currentUser.id)
                                            .map((m) => (
                                                <DropdownMenuItem
                                                    key={m.userId}
                                                    onClick={() => setAssigneeId(m.userId)}
                                                    className="flex items-center justify-between cursor-pointer py-2 px-2.5 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-2 truncate">
                                                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                                                            {m.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="font-medium truncate">{m.name}</p>
                                                            <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                                                        </div>
                                                    </div>
                                                    {assigneeId === m.userId && <Check size={13} className="text-primary shrink-0" />}
                                                </DropdownMenuItem>
                                            ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">
                                Due date
                            </Label>
                            <DatePicker
                                value={date}
                                onChange={(val) => setDate(val)}
                                placeholder="Select a due date"
                            />
                        </div>

                        {/* Priority Selection */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">Priority</Label>
                            <div className="flex flex-wrap gap-2">
                                {masterPriorities.map((p) => {
                                    const isSelected = priority === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setPriority(p.id)}
                                            className={cn(
                                                "flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-lg border transition-colors cursor-pointer",
                                                isSelected
                                                    ? "bg-foreground text-background font-semibold border-foreground shadow-none"
                                                    : "bg-white text-muted-foreground border-border hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dotColor)} />
                                            <span className="truncate">{p.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Workflow Status */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-foreground">Status</Label>
                            <div className="flex flex-wrap gap-2">
                                {masterStatuses.map((item) => {
                                    const isSelected = status === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setStatus(item.id)}
                                            className={cn(
                                                "flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors",
                                                isSelected
                                                    ? "border-primary bg-primary/10 font-semibold text-primary"
                                                    : "border-border bg-white text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", item.dotColor)} />
                                            <span>{item.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1.5">
                            <Label htmlFor="task-modal-desc" className="text-xs font-semibold text-foreground">
                                Description
                            </Label>
                            <Textarea
                                id="task-modal-desc"
                                placeholder="Add context, expected outcome, or useful notes"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[90px] text-xs rounded-lg bg-white border-border focus:border-primary transition-colors font-normal resize-none"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="rounded-lg text-xs h-9 px-4 border-border cursor-pointer hover:bg-muted"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting || !issueType || !priority || !status}
                            className="rounded-lg text-xs h-9 px-5 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-colors cursor-pointer shadow-none"
                        >
                            {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create task"}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
