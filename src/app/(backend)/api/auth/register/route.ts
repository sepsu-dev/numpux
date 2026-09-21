import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { status: "error", message: "Nama, email, dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { status: "error", message: "Kata sandi minimal 8 karakter" },
        { status: 400 }
      );
    }

    await createSession({
      userId: "1",
      email,
      name,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Akun berhasil didaftarkan",
        data: {
          id: "1",
          name,
          email,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memproses pendaftaran" },
      { status: 500 }
    );
  }
}
