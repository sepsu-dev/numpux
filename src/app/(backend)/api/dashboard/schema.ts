import { z } from "zod";

export const getDashboardQuerySchema = z.object({
  projectId: z.string().optional(),
});

export type GetDashboardQueryInput = z.infer<typeof getDashboardQuerySchema>;
