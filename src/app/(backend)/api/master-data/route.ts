import { initDb } from "@/db";
import { getOptionalAuthUser, validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";
import { createMasterDataSchema, deleteMasterDataSchema, updateMasterDataSchema } from "./schema";
import { createMasterData, deleteMasterData, findAllMasterData, updateMasterData } from "./query";

function canManage(role?: string) {
  return role === "admin" || role === "superadmin";
}

export async function GET(request: Request) {
  try {
    await initDb();
    const user = await getOptionalAuthUser(request);
    if (!user) return errorResponse("Unauthorized", 401);
    return successResponse(await findAllMasterData());
  } catch (error) {
    console.error("GET /api/master-data error:", error);
    return internalServerErrorResponse("Master data gagal dimuat");
  }
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error, auth.statusCode || 401);
  if (!canManage(auth.user.role)) return errorResponse("Hanya admin atau superadmin yang dapat mengubah master data", 403);
  try {
    await initDb();
    const parsed = createMasterDataSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Data tidak valid", parsed.error.flatten().fieldErrors);
    await createMasterData(parsed.data.resource, parsed.data.item);
    return successResponse(await findAllMasterData(), "Master data berhasil ditambahkan", { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") return badRequestResponse("Nama atau ID sudah digunakan");
    console.error("POST /api/master-data error:", error);
    return internalServerErrorResponse("Master data gagal ditambahkan");
  }
}

export async function PUT(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error, auth.statusCode || 401);
  if (!canManage(auth.user.role)) return errorResponse("Hanya admin atau superadmin yang dapat mengubah master data", 403);
  try {
    await initDb();
    const parsed = updateMasterDataSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Data tidak valid", parsed.error.flatten().fieldErrors);
    const updated = await updateMasterData(parsed.data.resource, parsed.data.id, parsed.data.updates);
    if (!updated) return badRequestResponse("Tidak ada perubahan yang dapat disimpan");
    return successResponse(await findAllMasterData(), "Master data berhasil diperbarui");
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "23505") return badRequestResponse("Nama sudah digunakan");
    console.error("PUT /api/master-data error:", error);
    return internalServerErrorResponse("Master data gagal diperbarui");
  }
}

export async function DELETE(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error, auth.statusCode || 401);
  if (!canManage(auth.user.role)) return errorResponse("Hanya admin atau superadmin yang dapat mengubah master data", 403);
  try {
    await initDb();
    const parsed = deleteMasterDataSchema.safeParse(await request.json());
    if (!parsed.success) return badRequestResponse("Data tidak valid", parsed.error.flatten().fieldErrors);
    const result = await deleteMasterData(parsed.data.resource, parsed.data.id);
    if (!result.ok) return badRequestResponse(result.reason || "Master data gagal dihapus");
    return successResponse(await findAllMasterData(), "Master data berhasil dihapus");
  } catch (error) {
    console.error("DELETE /api/master-data error:", error);
    return internalServerErrorResponse("Master data gagal dihapus");
  }
}
