import { validatePublicKey, getOptionalAuthUser } from "@/lib/api-auth";
import { badRequestResponse, successResponse, unauthorizedResponse } from "@/lib/response";
import { getDashboardQuerySchema } from "./schema";
import { getDashboardAggregateData } from "./query";

export async function GET(request: Request) {
  const { isValid } = validatePublicKey(request);
  if (!isValid) {
    return unauthorizedResponse(
      "Unauthorized. Missing or invalid public key. Provide 'X-Public-Key' header or '?public_key=' query parameter."
    );
  }

  const authUser = await getOptionalAuthUser(request);
  const { searchParams } = new URL(request.url);
  const parsed = getDashboardQuerySchema.safeParse({
    projectId: searchParams.get("projectId") || undefined,
  });

  if (!parsed.success) {
    return badRequestResponse("Invalid query parameters", parsed.error.flatten().fieldErrors);
  }

  const data = await getDashboardAggregateData(authUser?.userId, parsed.data.projectId);
  return successResponse(data);
}
