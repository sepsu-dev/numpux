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
import { motion } from "framer-motion";
import { ProjectFormModal } from "./project-form-modal";
import { MasterDataModal } from "@/components/settings/master-data-modal";
import { ProjectMembersModal } from "./project-members-modal";

const DEFAULT_MASTER_CATEGORIES = [
    "General",
    "Product & Tech",
    "Client Work",
    "Operations",
    "Marketing & Growth",
    "Personal / Self",
];

export function ProjectsClient({ projects: initialProjects }: { projects: Project[] }) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [membersProject, setMembersProject] = useState<Project | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Master categories with localStorage persistence
    const [masterCategories, setMasterCategories] = useState<string[]>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("numpux_master_categories");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            } catch {}
        }
        // Initialize with default plus any distinct categories found in projects
        const set = new Set<string>(DEFAULT_MASTER_CATEGORIES);
        initialProjects.forEach((p) => {
            if (p.category) set.add(p.category);
        });
        return Array.from(set);
    });

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
                        Manage your team projects, boards, and deliverables.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCategoriesModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-muted/60 hover:bg-muted text-foreground rounded-xl text-xs font-semibold border border-border/60 hover:border-border transition-all cursor-pointer"
                        title="Manage Categories"
                    >
                        <Tag size={14} className="text-muted-foreground" />
                        <span>Categories</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-98 transition-all shadow-xs cursor-pointer"
                    >
                        <Plus size={14} className="stroke-[2.5]" />
                        <span>Create Project</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 p-2.5 rounded-2xl border border-border/60">
                <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={14} />
                    <input
                        type="text"
                        placeholder="Search projects by name, category, or overview..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-card border border-border rounded-xl focus:outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
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
                        <SelectTrigger className="h-8 w-[150px] text-xs rounded-xl bg-card border-border/80">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="text-xs">
                            <SelectItem value="All" className="text-xs cursor-pointer">
                                All Categories
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
                {filteredProjects.map((project, idx) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.04 }}
                        className="bg-card border border-border/80 p-5 rounded-2xl shadow-2xs group hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                        {project.category || "General"}
                                    </span>
                                    {project.userRole && (
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                            project.userRole === "Owner"
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                : "bg-muted text-muted-foreground border-border/60"
                                        }`}>
                                            {project.userRole}
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
                                        <DropdownMenuItem
                                            onClick={() => setMembersProject(project)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <Users size={13} /> Manage Team
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setEditingProject(project)}
                                            className="cursor-pointer flex items-center gap-2"
                                        >
                                            <PencilSimple size={13} /> Edit Project
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-rose-600 focus:text-rose-600 cursor-pointer flex items-center gap-2"
                                            onClick={() => setDeleteId(project.id)}
                                        >
                                            <Trash size={13} /> Delete
                                        </DropdownMenuItem>
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
                                    <span className="text-muted-foreground font-medium">{project.tasks || 0} Tasks</span>
                                    <span className="font-semibold text-foreground">{project.progress || 0}%</span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
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

                {/* Create Project Card Placeholder */}
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="h-full min-h-[160px] border border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/20 rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-all cursor-pointer group"
                >
                    <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 flex items-center justify-center transition-all mb-2">
                        <Plus size={16} className="stroke-[2.5]" />
                    </div>
                    <h4 className="text-xs font-semibold text-foreground">Create New Project</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Add a new initiative workspace.</p>
                </button>
            </div>

            {/* Create Project Modal */}
            <ProjectFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                categories={masterCategories}
                onSuccess={handleProjectSaved}
            />

            {/* Edit Project Modal */}
            <ProjectFormModal
                open={!!editingProject}
                onOpenChange={(open) => !open && setEditingProject(null)}
                project={editingProject}
                categories={masterCategories}
                onSuccess={handleProjectSaved}
            />

            {/* Master Data Modal */}
            <MasterDataModal
                open={isCategoriesModalOpen}
                onOpenChange={setIsCategoriesModalOpen}
                initialTab="categories"
                onCategoriesChanged={setMasterCategories}
            />

            {/* Project Members Modal */}
            <ProjectMembersModal
                open={!!membersProject}
                onOpenChange={(open) => !open && setMembersProject(null)}
                project={membersProject}
            />

            {/* Delete Confirmation Modal */}
            <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="rounded-2xl border border-border p-6 font-sans shadow-xl bg-card max-w-sm">
                    <DialogHeader className="space-y-2">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Trash size={18} />
                        </div>
                        <DialogTitle className="text-base font-semibold text-foreground tracking-tight">Delete Project?</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            All tasks and deliverables associated with this project will be deleted. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-xl text-xs h-9 cursor-pointer"
                            onClick={() => setDeleteId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 rounded-xl text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
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