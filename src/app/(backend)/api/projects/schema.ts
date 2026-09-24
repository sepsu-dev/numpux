import { z } from "zod";

export const projectStatusSchema = z.enum(["Planning", "Active", "Completed"]);

export const createProjectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  category: z.string().min(1, "Project category is required"),
  description: z.string().optional().default(""),
  status: projectStatusSchema.optional().default("Planning"),
  tasks: z.number().int().nonnegative().optional().default(0),
  progress: z.number().min(0).max(100).optional().default(0),
});

export const updateProjectSchema = createProjectSchema.partial();

export const listProjectsQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQueryInput = z.infer<typeof listProjectsQuerySchema>;
