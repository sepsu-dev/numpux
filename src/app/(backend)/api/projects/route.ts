import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  paginatedResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/response";
import { createProjectSchema, listProjectsQuerySchema } from "./schema";
import { findProjects, insertProject } from "./query";
import { recordAudit } from "@/lib/audit";

export async function GET(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  const { searchParams } = new URL(request.url);
  const parsed = listProjectsQuerySchema.safeParse({
    status: searchParams.get("status") || undefined,
    category: searchParams.get("category") || undefined,
  });

  if (!parsed.success) {
    return badRequestResponse("Invalid query parameters", parsed.error.flatten().fieldErrors);
  }

  const { status, category } = parsed.data;
  let projects = await findProjects(auth.user.userId);

  if (status) {
    projects = projects.filter((p) => p.status.toLowerCase() === status.toLowerCase());
  }
  if (category) {
    projects = projects.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  return paginatedResponse(projects, { total: projects.length });
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid project input",
        parsed.error.flatten().fieldErrors
      );
    }

    const newProject = await insertProject(parsed.data, auth.user?.userId);
    await recordAudit({ userId: auth.user.userId, userName: auth.user.name, action: "created", entityType: "project", entityId: newProject.id, summary: `Created project ${newProject.title}` });
    return successResponse(newProject, "Project created successfully", { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return internalServerErrorResponse("Failed to process project data");
  }
}
