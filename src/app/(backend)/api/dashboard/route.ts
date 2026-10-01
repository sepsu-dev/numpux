import { validateAdminAuth } from "@/lib/api-auth";
import { badRequestResponse, errorResponse, successResponse } from "@/lib/response";
import { getDashboardQuerySchema } from "./schema";
import { getDashboardAggregateData } from "./query";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { searchParams } = new URL(request.url);
  const parsed = getDashboardQuerySchema.safeParse({
    projectId: searchParams.get("projectId") || undefined,
  });

  if (!parsed.success) {
    return badRequestResponse("Invalid query parameters", parsed.error.flatten().fieldErrors);
  }

  const data = await getDashboardAggregateData(auth.user.userId, parsed.data.projectId);
  return successResponse(data);
}
