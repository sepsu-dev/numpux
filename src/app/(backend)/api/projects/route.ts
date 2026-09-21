import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  let projects = listProjects();

  if (status) {
    projects = projects.filter((p) => p.status.toLowerCase() === status.toLowerCase());
  }
  if (category) {
    projects = projects.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  return NextResponse.json({
    status: "success",
    total: projects.length,
    data: projects,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.category) {
      return NextResponse.json(
        { status: "error", message: "Judul proyek dan kategori wajib diisi" },
        { status: 400 }
      );
    }

    const newProject = createProject({
      title: body.title,
      category: body.category,
      description: body.description || "",
      status: body.status || "Perencanaan",
      tasks: 0,
      progress: 0,
    });

    return NextResponse.json(
      { status: "success", message: "Proyek berhasil dibuat", data: newProject },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memproses data proyek" },
      { status: 500 }
    );
  }
}
