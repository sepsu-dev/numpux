import { initDb } from "@/db";
import { getOptionalAuthUser, validateAdminAuth } from "@/lib/api-auth";
import { markUserSeen } from "@/lib/user-db";
import { errorResponse, internalServerErrorResponse, successResponse } from "@/lib/response";
import { findMonitoringOverview } from "./query";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  if (auth.user.role !== "superadmin") {
    return errorResponse("Forbidden. Monitoring is available to the application owner only.", 403);
  }

  try {
    await initDb();
    return successResponse(await findMonitoringOverview());
  } catch (error) {
    console.error("GET /api/monitoring error:", error);
    return internalServerErrorResponse("Failed to load monitoring data");
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const user = await getOptionalAuthUser(request);
    if (!user?.userId) return errorResponse("Unauthorized", 401);
    await markUserSeen(user.userId);
    return successResponse(null, "Presence updated");
  } catch (error) {
    console.error("POST /api/monitoring error:", error);
    return internalServerErrorResponse("Failed to update presence");
  }
}
