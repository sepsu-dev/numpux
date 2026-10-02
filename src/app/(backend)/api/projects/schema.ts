import { z } from "zod";

export const createProjectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  category: z.string().min(1, "Project category is required"),
  description: z.string().optional().default(""),
  tasks: z.number().int().nonnegative().optional().default(0),
  progress: z.number().min(0).max(100).optional().default(0),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuerySchema = z.object({
  category: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQueryInput = z.infer<typeof listProjectsQuerySchema>;
