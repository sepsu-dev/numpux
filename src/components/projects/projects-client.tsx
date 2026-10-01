"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, DotsThree, PencilSimple, Trash, FolderSimple, SquaresFour, ListDashes, MagnifyingGlass, X, Tag, Users } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { deleteProjectAction } from "@/lib/actions";
import type { Project } from "@/types";
import { motion, useReducedMotion } from "framer-motion";
import { ProjectFormModal } from "./project-form-modal";
import { ManageCategoriesModal } from "./manage-categories-modal";
import { ProjectMembersModal } from "./project-members-modal";
import { useMasterDataStore } from "@/stores/master-data-store";

export function ProjectsClient({ projects: initialProjects }: { projects: Project[] }) {
    const reduceMotion = useReducedMotion();
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [membersProject, setMembersProject] = useState<Project | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { categories: masterCategories, projectStatuses, loadAll } = useMasterDataStore();

    useEffect(() => { void loadAll(); }, [loadAll]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        // Include master categories & categories from actual projects
        masterCategories.forEach((c) => set.add(c));
        projects.forEach((p) => {
            if (p.category) set.add(p.category);
        });
        return ["All", ...Array.from(set)];
    }, [projects, masterCategories]);

    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            const matchesSearch =
                p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [projects, searchQuery, selectedCategory]);

    const handleProjectSaved = (savedProject: Project, isEdit: boolean) => {
        if (isEdit) {
            setProjects((prev) =>
                prev.map((p) => (p.id === savedProject.id ? { ...p, ...savedProject } : p))
            );
        } else {
            setProjects((prev) => [savedProject, ...prev]);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        await deleteProjectAction(id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-bold text-foreground tracking-tight">Projects</h2>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            {filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}
                        </span>
                    </div>
                    <p className="text-muted-foreground text-xs mt-1">
                        Keep related tasks, people, and progress together.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCategoriesModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 hover:bg-muted text-foreground rounded-lg text-xs font-semibold border border-border/60 hover:border-border transition-colors cursor-pointer"
                        title="Manage categories"
                    >
                        <Tag size={14} className="text-muted-foreground" />
                        <span>Categories</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90 transition-colors shadow-none cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Create project</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-2.5 rounded-lg border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search projects"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-card border border-border rounded-lg focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/60"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">Category:</span>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-8 w-[150px] text-xs rounded-lg bg-card border-border/80">
                            <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="All" className="text-xs cursor-pointer">
                                All categories
                            </SelectItem>
                            {categories
                                .filter((c) => c !== "All")
                                .map((cat) => (
                                    <SelectItem key={cat} value={cat} className="text-xs cursor-pointer">
                                        {cat}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProjects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        layout={!reduceMotion}
                        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={reduceMotion ? undefined : { y: -2 }}
                        transition={{ duration: 0.3, delay: Math.min(index * 0.035, 0.2), ease: [0.16, 1, 0.3, 1] }}
                        className="bg-card border border-border/80 p-5 rounded-lg shadow-none group hover:border-primary/40 hover:shadow-none transition-colors flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                        {project.category || "Uncategorized"}
                                    </span>
                                    {(() => {
                                        const status = projectStatuses.find((item) => item.id === project.status);
                                        return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${status?.colorClass || "bg-muted text-muted-foreground border-border"}`}>{status?.name || project.status}</span>;
                                    })()}
                                    {project.userRole && (
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                            project.userRole.toLowerCase() === "owner"
                                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                : "bg-muted text-muted-foreground border-border/60"
                                        }`}>
                                            {project.userRole.charAt(0).toUpperCase() + project.userRole.slice(1)}
                                        </span>
                                    )}
                                    {project.membersCount !== undefined && project.membersCount > 0 && (
                                        <button
                                            onClick={() => setMembersProject(project)}
                                            className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/80 hover:bg-muted px-2 py-0.5 rounded-md border border-border/60 transition-colors cursor-pointer"
                                            title="View project team"
                                        >
                                            <Users size={11} />
                                            <span>{project.membersCount}</span>
                                        </button>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-70 group-hover:opacity-100 cursor-pointer">
                                            <DotsThree size={18} weight="bold" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40 p-1 text-xs">
                                        {["owner", "admin"].includes((project.userRole || "").toLowerCase()) && <DropdownMenuItem
                                            onClick={() => setMembersProject(project)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <Users size={13} /> Manage members
                                        </DropdownMenuItem>}
                                        {["owner", "admin"].includes((project.userRole || "").toLowerCase()) && <DropdownMenuItem
                                            onClick={() => setEditingProject(project)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <PencilSimple size={13} /> Edit project
                                        </DropdownMenuItem>}
                                        {(project.userRole || "").toLowerCase() === "owner" && <DropdownMenuItem
                                            className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2"
                                            onClick={() => setDeleteId(project.id)}
                                        >
                                            <Trash size={13} /> Delete
                                        </DropdownMenuItem>}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <Link href={`/tasks?projectId=${project.id}`} className="block group/link">
                                <h3 className="text-sm font-semibold text-foreground tracking-tight group-hover/link:text-primary transition-colors mb-1.5 line-clamp-1">
                                    {project.title}
                                </h3>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                                    {project.description || "No project overview provided."}
                                </p>
                            </Link>
                        </div>

                        <div className="mt-5 pt-3.5 border-t border-border/50 space-y-3">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-muted-foreground font-medium">{project.tasks || 0} tasks</span>
                                    <span className="font-semibold text-foreground">{project.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-colors duration-500"
                                        style={{ width: `${project.progress || 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Link
                                    href={`/tasks/kanban?projectId=${project.id}`}
                                    className="flex-1 py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <SquaresFour size={13} />
                                    <span>Kanban</span>
                                </Link>
                                <Link
                                    href={`/tasks?projectId=${project.id}`}
                                    className="flex-1 py-1.5 px-2 bg-muted/60 hover:bg-muted text-foreground font-medium text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-border/60"
                                >
                                    <ListDashes size={13} />
                                    <span>List</span>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Create project Card Placeholder */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-full min-h-[160px] border border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/20 rounded-lg flex flex-col items-center justify-center p-6 text-center transition-colors cursor-pointer group"
                >
                    <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center transition-colors mb-2">
                        <Plus size={16} className="stroke-[2.5]" />
                    </div>
                    <h4 className="text-xs font-semibold text-foreground">Create project</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Add another project.</p>
                </button>
            </div>

            {/* Create project Modal */}
            <ProjectFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                categories={masterCategories}
                onSuccess={handleProjectSaved}
            />

            {/* Edit project Modal */}
            <ProjectFormModal
                open={!!editingProject}
                onOpenChange={(open) => !open && setEditingProject(null)}
                project={editingProject}
                categories={masterCategories}
                onSuccess={handleProjectSaved}
            />

            {/* Master Data Modal */}
            <ManageCategoriesModal
                open={isCategoriesModalOpen}
                onOpenChange={setIsCategoriesModalOpen}
            />

            {/* Project Members Modal */}
            <ProjectMembersModal
                open={!!membersProject}
                onOpenChange={(open) => !open && setMembersProject(null)}
                project={membersProject}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-lg border border-border p-6 font-sans shadow-none bg-card max-w-sm">
                    <DialogHeader className="space-y-2">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Trash size={18} />
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground tracking-tight">Delete project?</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            This project and all of its tasks will be permanently deleted. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-lg text-xs h-9 cursor-pointer"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 rounded-lg text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
                            onClick={handleDeleteConfirm}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
