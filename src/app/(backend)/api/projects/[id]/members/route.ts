import { findUserByEmail, createUser } from "@/lib/user-db";
import { validateAdminAuth } from "@/lib/api-auth";
import { findProjectById } from "@/app/(backend)/api/projects/query";
import {
  badRequestResponse,
  errorResponse,
  internalServerErrorResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
} from "@/lib/response";
import type { User } from "@/types";
import { addProjectMemberSchema } from "./schema";
import { findProjectMembers, insertProjectMember } from "./query";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id: projectId } = await params;
  try {
    const project = await findProjectById(projectId, auth.user?.userId);
    if (!project) {
      return notFoundResponse("Project not found or unauthorized");
    }

    const members = await findProjectMembers(projectId);
    return paginatedResponse(members, { total: members.length });
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to fetch project members");
  }
}

export async function POST(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return errorResponse(auth.error || "Unauthorized", auth.statusCode || 401);
  }

  const { id: projectId } = await params;
  try {
    const project = await findProjectById(projectId, auth.user?.userId);
    if (!project) {
      return notFoundResponse("Project not found or unauthorized");
    }

    const body = await request.json();
    const parsed = addProjectMemberSchema.safeParse(body);

    if (!parsed.success) {
      return badRequestResponse(
        parsed.error.issues[0]?.message || "Invalid member data",
        parsed.error.flatten().fieldErrors
      );
    }

    const { email, role } = parsed.data;

    let targetUser: User | null = await findUserByEmail(email.trim().toLowerCase());
    if (!targetUser) {
      const defaultName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const tempPass = crypto.randomUUID() + "-" + Date.now();
      targetUser = await createUser(defaultName, email.trim().toLowerCase(), tempPass);
    }

    if (!targetUser) {
      return internalServerErrorResponse("Failed to resolve user account");
    }

    const newMember = await insertProjectMember(projectId, targetUser.id, role);

    return successResponse(
      newMember,
      `${targetUser.name || email} (${email}) added to project!`,
      { status: 201 }
    );
  } catch (error: any) {
    return internalServerErrorResponse(error?.message || "Failed to add project member");
  }
}
