import { NextResponse } from "next/server";
import { listTasks, updateTask } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";
import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";

export async function GET(request: Request) {
  const { isValid } = validatePublicKey(request);
  if (!isValid) {
    return NextResponse.json(
      {
        status: "error",
        message: "Unauthorized. Missing or invalid public key. Provide 'X-Public-Key' header or '?public_key=' query parameter.",
      },
      { status: 401 }
    );
  }

  const authUser = await getOptionalAuthUser(request);
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId") || undefined;

  const allTasks = await listTasks(authUser?.userId, projectId);

  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: allTasks.filter((t) => t.status === "To Do"),
    },
    {
      id: "inprogress",
      title: "In Progress",
      tasks: allTasks.filter((t) => t.status === "In Progress"),
    },
    {
      id: "review",
      title: "Review",
      tasks: allTasks.filter((t) => t.status === "Review"),
    },
    {
      id: "done",
      title: "Done",
      tasks: allTasks.filter((t) => t.status === "Done"),
    },
  ];

  return NextResponse.json({
    status: "success",
    data: columns,
  });
}

export async function PATCH(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json();
    const { taskId, targetStatus } = body;

    if (!taskId || !targetStatus) {
      return NextResponse.json(
        { status: "error", message: "taskId and targetStatus are required" },
        { status: 400 }
      );
    }

    const updated = await updateTask(taskId, { status: targetStatus as TaskStatus }, auth.user?.userId);

    if (!updated) {
      return NextResponse.json(
        { status: "error", message: `Task #${taskId} not found or unauthorized` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Task moved to ${targetStatus}`,
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to update task status" },
      { status: 500 }
    );
  }
}
