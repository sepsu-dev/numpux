import { NextResponse } from "next/server";
import { listTasks, createTask } from "@/lib/store";
import type { TaskStatus, Priority } from "@/lib/types";
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
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const project = searchParams.get("project");
  const projectId = searchParams.get("projectId");

  // Scoped to authenticated user
  let tasks = await listTasks(authUser?.userId, projectId || undefined);

  if (status) {
    tasks = tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }
  if (priority) {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
  }
  if (project) {
    tasks = tasks.filter((t) => t.project.toLowerCase() === project.toLowerCase());
  }

  return NextResponse.json({
    status: "success",
    total: tasks.length,
    data: tasks,
  });
}

export async function POST(request: Request) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body.title || !body.projectId) {
      return NextResponse.json(
        { status: "error", message: "Task title and projectId are required" },
        { status: 400 }
      );
    }

    const newTask = await createTask(
      {
        title: body.title,
        projectId: body.projectId,
        project: body.project || "Project",
        priority: (body.priority as Priority) || "Medium",
        date: body.date || undefined,
        status: (body.status as TaskStatus) || "To Do",
        description: body.description || undefined,
        assigneeId: body.assigneeId || undefined,
        issueType: body.issueType || "Task",
      },
      auth.user?.userId
    );

    return NextResponse.json(
      { status: "success", message: "Task created successfully", data: newTask },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to process task data" },
      { status: 500 }
    );
  }
}
