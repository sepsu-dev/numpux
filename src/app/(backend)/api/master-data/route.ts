import { initDb } from "@/db";
import { getOptionalAuthUser, validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";
import { createMasterDataSchema, deleteMasterDataSchema, updateMasterDataSchema } from "./schema";
import { createMasterData, deleteMasterData, findAllMasterData, updateMasterData } from "./query";
import { recordAudit } from "@/lib/audit";

function canManage(role?: string) {
  return role === "superadmin";
}

export async function GET(request: Request) {
  try {
    await initDb();
    const user = await getOptionalAuthUser(request);
    if (!user) return errorResponse("Unauthorized", 401);
    return successResponse(await findAllMasterData());
  } catch (error) {
    console.error("GET /api/master-data error:", error);
    return internalServerErrorResponse("Failed to load master data");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error, auth.statusCode || 401);
  if (!canManage(auth.user.role)) return errorResponse("Only the application owner can manage master data", 403);
  try {
    await initDb();
    const parsed = createMasterDataSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Invalid data", parsed.error.flatten().fieldErrors);
    await createMasterData(parsed.data.resource, parsed.data.item);
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "created", entityType: parsed.data.resource, entityId: parsed.data.item.id, summary: `Created ${parsed.data.resource} item ${parsed.data.item.name}` });
    return successResponse(await findAllMasterData(), "Master data was added", { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") return badRequestResponse("This name or ID is already in use");
    console.error("POST /api/master-data error:", error);
    return internalServerErrorResponse("Failed to add master data");
  }
}

export async function PUT(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error, auth.statusCode || 401);
  if (!canManage(auth.user.role)) return errorResponse("Only the application owner can manage master data", 403);
  try {
    await initDb();
    const parsed = updateMasterDataSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Invalid data", parsed.error.flatten().fieldErrors);
    const updated = await updateMasterData(parsed.data.resource, parsed.data.id, parsed.data.updates);
    if (!updated) return badRequestResponse("There are no changes to save");
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "updated", entityType: parsed.data.resource, entityId: parsed.data.id, summary: `Updated ${parsed.data.resource} item`, metadata: parsed.data.updates });
    return successResponse(await findAllMasterData(), "Master data was updated");
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") return badRequestResponse("This name is already in use");
    console.error("PUT /api/master-data error:", error);
    return internalServerErrorResponse("Failed to update master data");
  }
}

export async function DELETE(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error, auth.statusCode || 401);
  if (!canManage(auth.user.role)) return errorResponse("Only the application owner can manage master data", 403);
  try {
    await initDb();
    const parsed = deleteMasterDataSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Invalid data", parsed.error.flatten().fieldErrors);
    const result = await deleteMasterData(parsed.data.resource, parsed.data.id);
    if (!result.ok) return badRequestResponse(result.reason || "Failed to delete master data");
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "deleted", entityType: parsed.data.resource, entityId: parsed.data.id, summary: `Deleted ${parsed.data.resource} item` });
    return successResponse(await findAllMasterData(), "Master data was deleted");
  } catch (error) {
    console.error("DELETE /api/master-data error:", error);
    return internalServerErrorResponse("Failed to delete master data");
  }
}
