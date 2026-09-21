import { NextResponse } from "next/server";
import { listTasks, updateTask } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

export async function GET() {
  const allTasks = listTasks();

  const columns = [
    {
      id: "todo",
      title: "To Do",
      tasks: allTasks.filter((t) => t.status === "Belum Mulai"),
    },
    {
      id: "inprogress",
      title: "In Progress",
      tasks: allTasks.filter((t) => t.status === "Proses"),
    },
    {
      id: "review",
      title: "Review",
      tasks: allTasks.filter((t) => t.status === "Peninjauan"),
    },
    {
      id: "done",
      title: "Done",
      tasks: allTasks.filter((t) => t.status === "Selesai"),
    },
  ];

  return NextResponse.json({
    status: "success",
    data: columns,
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { taskId, targetStatus } = body;

    if (!taskId || !targetStatus) {
      return NextResponse.json(
        { status: "error", message: "taskId dan targetStatus wajib disertakan" },
        { status: 400 }
      );
    }

    const updated = updateTask(String(taskId), {
      status: targetStatus as TaskStatus,
    });

    if (!updated) {
      return NextResponse.json(
        { status: "error", message: "Tugas tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Status Kanban tugas berhasil diperbarui",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memperbarui status Kanban" },
      { status: 500 }
    );
  }
}
