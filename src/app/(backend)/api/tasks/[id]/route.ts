import { NextResponse } from "next/server";
import { getTask, updateTask, deleteTask } from "@/lib/store";
import { validatePublicKey, validateAdminAuth, getOptionalAuthUser } from "@/lib/api-auth";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
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
  const { id } = await params;
  const task = await getTask(id, authUser?.userId);

  if (!task) {
    return NextResponse.json(
      { status: "error", message: `Task #${id} not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: task,
  });
}

export async function PUT(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await updateTask(id, body, auth.user?.userId);

    if (!updated) {
      return NextResponse.json(
        { status: "error", message: `Task #${id} not found or unauthorized` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Task updated successfully",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  const { id } = await params;
  try {
    const existing = await getTask(id, auth.user?.userId);
    if (!existing) {
      return NextResponse.json(
        { status: "error", message: `Task #${id} not found or unauthorized` },
        { status: 404 }
      );
    }

    await deleteTask(id, auth.user?.userId);
    return NextResponse.json({
      status: "success",
      message: `Task #${id} deleted successfully`,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to delete task" },
      { status: 500 }
    );
  }
}
