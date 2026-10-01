import { z } from "zod";

export const projectMemberRoleSchema = z.string().trim().min(1).max(100);

export const addProjectMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: projectMemberRoleSchema.optional().default("contributor"),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
