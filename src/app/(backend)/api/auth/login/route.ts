import { NextResponse } from "next/server";
import { createSession } from "@/lib/session";

const DEMO_USER = {
  id: "1",
  name: "Admin Numpux",
  email: "admin@numpux.com",
  password: "admin123",
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email dan kata sandi wajib diisi" },
        { status: 400 }
      );
    }

    if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
      return NextResponse.json(
        { status: "error", message: "Email atau kata sandi salah" },
        { status: 401 }
      );
    }

    await createSession({
      userId: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
    });

    return NextResponse.json({
      status: "success",
      message: "Berhasil masuk",
      data: {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
      },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Gagal memproses login" },
      { status: 500 }
    );
  }
}
