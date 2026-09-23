import { NextResponse } from "next/server";
import { removeProjectMember, getProject } from "@/lib/store";
import { validateAdminAuth } from "@/lib/api-auth";

interface Props {
  params: Promise<{ id: string; memberId: string }>;
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  const { id: projectId, memberId } = await params;
  try {
    const project = await getProject(projectId, auth.user?.userId);
    if (!project) {
      return NextResponse.json(
        { status: "error", message: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const removed = await removeProjectMember(projectId, memberId);
    if (!removed) {
      return NextResponse.json(
        { status: "error", message: "Cannot remove project owner or member not found" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Member removed from project",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to remove member" },
      { status: 500 }
    );
  }
}
