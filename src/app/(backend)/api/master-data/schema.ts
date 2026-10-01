import { z } from "zod";

export const masterResourceSchema = z.enum([
  "categories",
  "issueTypes",
  "priorities",
  "statuses",
  "projectStatuses",
]);

const baseItemSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional(),
});

export const createMasterDataSchema = z.discriminatedUnion("resource", [
  z.object({
    resource: z.literal("categories"),
    item: baseItemSchema,
  }),
  z.object({
    resource: z.literal("issueTypes"),
    item: baseItemSchema.extend({
      description: z.string().max(500).optional(),
      iconName: z.enum(["CheckSquare", "Bug", "BookmarkSimple", "Lightning", "Shield", "Fire", "Rocket"]),
      colorClass: z.string().min(1).max(500),
    }),
  }),
  z.object({
    resource: z.literal("priorities"),
    item: baseItemSchema.extend({
      level: z.number().int().min(1).max(5),
      dotColor: z.string().min(1).max(100),
      badgeClass: z.string().min(1).max(500),
      severityClass: z.string().min(1).max(500),
    }),
  }),
  z.object({
    resource: z.literal("statuses"),
    item: baseItemSchema.extend({
      description: z.string().max(500).optional(),
      order: z.number().int().min(1),
      dotColor: z.string().min(1).max(100),
      badgeClass: z.string().min(1).max(500),
      headerBorder: z.string().min(1).max(100),
      isCompleted: z.boolean(),
    }),
  }),
  z.object({
    resource: z.literal("projectStatuses"),
    item: baseItemSchema.extend({
      description: z.string().max(500).optional(),
      colorClass: z.string().min(1).max(500),
      order: z.number().int().min(1),
      isCompleted: z.boolean(),
    }),
  }),
]);

export const updateMasterDataSchema = z.object({
  resource: masterResourceSchema,
  id: z.string().trim().min(1).max(64),
  updates: z.record(z.string(), z.unknown()),
});

export const deleteMasterDataSchema = z.object({
  resource: masterResourceSchema,
  id: z.string().trim().min(1).max(64),
});

