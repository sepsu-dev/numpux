import { z } from "zod";

export const userRoleSchema = z.enum(["superadmin", "admin", "user"]);

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: userRoleSchema.optional().default("user"),
});

export const getUsersQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  role: userRoleSchema.optional(),
  accountStatus: z.enum(["active", "suspended"]).optional(),
  password: z.string().min(8).optional(),
  forceLogout: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
