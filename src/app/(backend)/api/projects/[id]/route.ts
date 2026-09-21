import { NextResponse } from "next/server";
import { getProject, updateProject, deleteProject } from "@/lib/store";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const project = getProject(id);

  if (!project) {
    return NextResponse.json(
      { status: "error", message: `Proyek #${id} tidak ditemukan` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: project,
  });
}

export async function PUT(request: Request, { params }: Props) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateProject(id, body);

    if (!updated) {
      return NextResponse.json(
        { status: "error", message: `Proyek #${id} tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Proyek berhasil diperbarui",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memperbarui proyek" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id } = await params;
  const existing = getProject(id);

  if (!existing) {
    return NextResponse.json(
      { status: "error", message: `Proyek #${id} tidak ditemukan` },
      { status: 404 }
    );
  }

  deleteProject(id);

  return NextResponse.json({
    status: "success",
    message: `Proyek #${id} berhasil dihapus`,
  });
}
