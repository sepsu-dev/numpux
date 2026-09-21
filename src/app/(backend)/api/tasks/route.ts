import { NextResponse } from "next/server";
import { listTasks, createTask } from "@/lib/store";
import type { TaskStatus, Priority } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const project = searchParams.get("project");
  const projectId = searchParams.get("projectId");

  let tasks = listTasks();

  if (projectId) {
    tasks = tasks.filter((t) => t.projectId === projectId);
  }
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
  try {
    const body = await request.json();

    if (!body.title || !body.project) {
      return NextResponse.json(
        { status: "error", message: "Judul tugas dan nama proyek wajib diisi" },
        { status: 400 }
      );
    }

    const newTask = createTask({
      title: body.title,
      projectId: body.projectId || undefined,
      project: body.project,
      priority: (body.priority as Priority) || "Sedang",
      date: body.date || "Segera",
      status: (body.status as TaskStatus) || "Belum Mulai",
      description: body.description || "",
    });

    return NextResponse.json(
      { status: "success", message: "Tugas berhasil dibuat", data: newTask },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memproses data tugas" },
      { status: 500 }
    );
  }
}
