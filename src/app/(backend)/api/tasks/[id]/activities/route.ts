import { NextResponse } from "next/server";
import { listTaskActivities, getTask } from "@/lib/store";
import { validateAdminAuth } from "@/lib/api-auth";

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

  const { id: taskId } = await params;
  try {
    const task = await getTask(taskId, auth.user?.userId);
    if (!task) {
      return NextResponse.json(
        { status: "error", message: "Task not found or unauthorized" },
        { status: 404 }
      );
    }

    const activities = await listTaskActivities(taskId);
    return NextResponse.json({
      status: "success",
      total: activities.length,
      data: activities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
