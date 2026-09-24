import { z } from "zod";

export const projectMemberRoleSchema = z.enum(["Owner", "Admin", "Member", "Viewer"]);

export const addProjectMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: projectMemberRoleSchema.optional().default("Member"),
});

export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
