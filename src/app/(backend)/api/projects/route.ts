import { NextResponse } from "next/server";
import { listProjects, createProject } from "@/lib/store";
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
  const category = searchParams.get("category");

  // Filter projects by authenticated user if logged in
  let projects = await listProjects(authUser?.userId);

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
  const auth = await validateAdminAuth(request);
  if (!auth.isValid) {
    return NextResponse.json(
      { status: "error", message: auth.error },
      { status: auth.statusCode || 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body.title || !body.category) {
      return NextResponse.json(
        { status: "error", message: "Project title and category are required" },
        { status: 400 }
      );
    }

    const newProject = await createProject(
      {
        title: body.title,
        category: body.category,
        description: body.description || "",
        status: body.status || "Planning",
        tasks: 0,
        progress: 0,
      },
      auth.user?.userId
    );

    return NextResponse.json(
      { status: "success", message: "Project created successfully", data: newProject },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to process project data" },
      { status: 500 }
    );
  }
}
