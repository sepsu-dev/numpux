"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { createTask, createProject, deleteTask, deleteProject, updateTask, updateProject } from "@/lib/store";
import type { TaskStatus } from "@/lib/types";

export type AuthState = { errors?: Record<string, string[]>; message?: string } | undefined;

const DEMO_USER = { id: "1", name: "Admin Numpux", email: "admin@numpux.com", password: "admin123" };

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const { email, password } = validated.data;
  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return { message: "Invalid email or password" };
  }

  await createSession({ userId: DEMO_USER.id, email: DEMO_USER.email, name: DEMO_USER.name });
  redirect("/dashboard");
}

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const validated = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const { name, email } = validated.data;
  await createSession({ userId: "1", email, name });
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const taskSchema = z.object({
  title: z.string().min(1, { message: "Task title is required" }),
  projectId: z.string().optional().default(""),
  project: z.string().optional().default(""),
  priority: z.enum(["Rendah", "Sedang", "Tinggi", "Mendesak"]).default("Sedang"),
  date: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export async function createTaskAction(formData: FormData) {
  const session = (await getSession()) || { userId: "1", email: "admin@numpux.com", name: "Admin Numpux" };

  const parsed = taskSchema.safeParse({
    title: formData.get("title"),
    projectId: formData.get("projectId"),
    project: formData.get("project"),
    priority: formData.get("priority"),
    date: formData.get("date"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { title, projectId, priority, date, description } = parsed.data;
  let projectName = parsed.data.project;
  if (projectId) {
    const { getProject } = await import("@/lib/store");
    const proj = getProject(projectId);
    if (proj) projectName = proj.title;
  }

  createTask({
    title,
    projectId: projectId || undefined,
    project: projectName || "General Project",
    priority,
    date: date || "Today",
    status: "Belum Mulai",
    description: description || undefined,
  });
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function deleteTaskAction(id: string) {
  deleteTask(id);
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function updateTaskStatusAction(id: string, status: string) {
  const valid = ["Belum Mulai", "Proses", "Peninjauan", "Selesai"];
  if (!valid.includes(status)) return;
  updateTask(id, { status: status as TaskStatus });
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

const projectSchema = z.object({
  title: z.string().min(1, { message: "Project title is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z.string().optional().default(""),
});

export async function createProjectAction(formData: FormData) {
  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { title, category, description } = parsed.data;
  createProject({ title, category, description, status: "Perencanaan", tasks: 0, progress: 0 });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function deleteProjectAction(id: string) {
  deleteProject(id);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
