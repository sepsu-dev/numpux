import { z } from "zod";

export const prioritySchema = z.enum(["Low", "Medium", "High", "Urgent"]);
export const taskStatusSchema = z.enum(["To Do", "In Progress", "Review", "Done"]);
export const issueTypeSchema = z.enum(["Task", "Bug", "Story"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  projectId: z.string().min(1, "projectId is required"),
  project: z.string().optional().default("Project"),
  priority: prioritySchema.optional().default("Medium"),
  date: z.string().optional(),
  status: taskStatusSchema.optional().default("To Do"),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  issueType: issueTypeSchema.optional().default("Task"),
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
