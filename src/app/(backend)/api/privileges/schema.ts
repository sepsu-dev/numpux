import { z } from "zod";

export const updatePrivilegeSchema = z.object({
  type: z.enum(["user", "project"]).default("user"),
  groupName: z.string().min(1),
  menuId: z.string().min(1),
  canView: z.boolean(),
});

export const updateProjectPrivilegeSchema = z.object({
  groupName: z.enum(["owner", "admin", "member"]),
  menuId: z.string().min(1),
  canView: z.boolean(),
});

export const createMenuSchema = z.object({
  name: z.string().min(1).max(100),
  path: z.string().min(1).max(255),
  icon: z.string().optional(),
  section: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const updateMenuSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  icon: z.string().optional(),
  section: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const createProjectGroupSchema = z.object({
  name: z.string().min(2).max(50),
  displayName: z.string().min(2).max(100),
  description: z.string().optional(),
});

export const createSectionSchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateSectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdatePrivilegeInput = z.infer<typeof updatePrivilegeSchema>;
export type UpdateProjectPrivilegeInput = z.infer<typeof updateProjectPrivilegeSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type CreateProjectGroupInput = z.infer<typeof createProjectGroupSchema>;
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
