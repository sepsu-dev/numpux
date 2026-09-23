import { NextResponse } from "next/server";
import { listProjectMembers, addProjectMember, getProject } from "@/lib/store";
import { findUserByEmail, createUser } from "@/lib/user-db";
import { validateAdminAuth } from "@/lib/api-auth";
import type { ProjectMemberRole, User } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  const { id: projectId } = await params;
  try {
    const project = await getProject(projectId, auth.user?.userId);
    if (!project) {
      return NextResponse.json(
        { status: "error", message: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const members = await listProjectMembers(projectId);
    return NextResponse.json({
      status: "success",
      total: members.length,
      data: members,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  const { id: projectId } = await params;
  try {
    const project = await getProject(projectId, auth.user?.userId);
    if (!project) {
      return NextResponse.json(
        { status: "error", message: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const role: ProjectMemberRole = body.role || "Member";

    if (!email) {
      return NextResponse.json(
        { status: "error", message: "Email is required to invite a member" },
        { status: 400 }
      );
    }

    // Find registered user by email, or auto-provision invited member so email is all that's needed!
    let targetUser: User | null = await findUserByEmail(email);
    if (!targetUser) {
      const defaultName = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const tempPass = crypto.randomUUID() + "-" + Date.now();
      targetUser = await createUser(defaultName, email, tempPass);
    }

    if (!targetUser) {
      return NextResponse.json(
        { status: "error", message: "Failed to resolve user account" },
        { status: 500 }
      );
    }

    const newMember = await addProjectMember(projectId, targetUser.id, role);

    return NextResponse.json(
      {
        status: "success",
        message: `${targetUser.name || email} (${email}) added to project!`,
        data: newMember,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to add project member" },
      { status: 500 }
    );
  }
}
