import { z } from "zod";

export const prioritySchema = z.string().trim().min(1, "Priority is required").max(50, "Priority is too long");
export const taskStatusSchema = z.string().trim().min(1, "Task status is required").max(50, "Task status is too long");
export const issueTypeSchema = z.string().trim().min(1, "Task type is required").max(50, "Task type is too long");

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  projectId: z.string().min(1, "projectId is required"),
  project: z.string().optional().default("Project"),
  priority: prioritySchema,
  date: z.string().optional(),
  status: taskStatusSchema,
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  issueType: issueTypeSchema,
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  projectId: z.string().optional(),
  project: z.string().optional(),
  priority: prioritySchema.optional(),
  date: z.string().nullable().optional(),
  status: taskStatusSchema.optional(),
  description: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  issueType: issueTypeSchema.optional(),
});

export const listTasksQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  project: z.string().optional(),
  projectId: z.string().optional(),
});

export const kanbanPatchSchema = z.object({
  taskId: z.string().min(1, "taskId is required"),
  targetStatus: taskStatusSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;
export type KanbanPatchInput = z.infer<typeof kanbanPatchSchema>;
