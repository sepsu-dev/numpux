import { NextResponse } from "next/server";
import { getTask, updateTask, deleteTask } from "@/lib/store";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
  const task = getTask(id);

  if (!task) {
    return NextResponse.json(
      { status: "error", message: `Tugas #${id} tidak ditemukan` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: task,
  });
}

export async function PUT(request: Request, { params }: Props) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = updateTask(id, body);

    if (!updated) {
      return NextResponse.json(
        { status: "error", message: `Tugas #${id} tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: "Tugas berhasil diperbarui",
      data: updated,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memperbarui tugas" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const { id } = await params;
  const existing = getTask(id);

  if (!existing) {
    return NextResponse.json(
      { status: "error", message: `Tugas #${id} tidak ditemukan` },
      { status: 404 }
    );
  }

  deleteTask(id);

  return NextResponse.json({
    status: "success",
    message: `Tugas #${id} berhasil dihapus`,
  });
}
