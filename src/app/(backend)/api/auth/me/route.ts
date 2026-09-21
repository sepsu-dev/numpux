import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/session";

export async function POST() {
  await deleteSession();
  return NextResponse.json({
    status: "success",
    message: "Berhasil keluar",
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { status: "error", message: "Belum login" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "success",
    data: session,
  });
}
