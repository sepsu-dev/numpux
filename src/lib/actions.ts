"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { initDb } from "@/db";
import { findUserByEmail, createUser, hashPassword } from "@/lib/user-db";
import { createTask, createProject, deleteTask, deleteProject, updateTask } from "@/lib/store";
import type { TaskStatus } from "@/types";

export type AuthState = { errors?: Record<string, string[]>; message?: string } | undefined;

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

  await initDb();
  const { email, password } = validated.data;
  const user = await findUserByEmail(email.trim().toLowerCase());

  if (!user || user.password_hash !== hashPassword(password)) {
    return { message: "Invalid email or password" };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
  });
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

  await initDb();
  const { name, email, password } = validated.data;
  const existingUser = await findUserByEmail(email.trim().toLowerCase());
  if (existingUser) {
    return { message: "An account with this email already exists" };
  }

  const newUser = await createUser(name.trim(), email.trim().toLowerCase(), password);
  await createSession({
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role || "user",
  });
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const taskSchema = z.object({
  title: z.string().min(1, { message: "Task title is required" }),
  projectId: z.string().min(1, { message: "Project is required" }),
  project: z.string().optional().default(""),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  date: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export async function createTaskAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

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
  const { getProject } = await import("@/lib/store");
  const proj = await getProject(projectId, session.userId);
  if (proj) projectName = proj.title;

  await createTask(
    {
      title,
      projectId,
      project: projectName || "Project",
      priority,
      date: date.trim() ? date.trim() : undefined,
      status: "To Do",
      description: description || undefined,
    },
    session.userId
  );

  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/tasks");
}

export async function deleteTaskAction(id: string) {
  const session = await getSession();
  if (!session) return;

  await deleteTask(id, session.userId);
  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function updateTaskStatusAction(id: string, status: string) {
  const session = await getSession();
  if (!session) return;

  const valid = ["To Do", "In Progress", "Review", "Done"];
  if (!valid.includes(status)) return;
  await updateTask(id, { status: status as TaskStatus }, session.userId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

const projectSchema = z.object({
  title: z.string().min(1, { message: "Project title is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  description: z.string().optional().default(""),
});

export async function createProjectAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const parsed = projectSchema.safeParse({
    title: formData.get("title"),
    category: formData.get("category"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const { title, category, description } = parsed.data;
  await createProject(
    { title, category, description, status: "Active", tasks: 0, progress: 0 },
    session.userId
  );
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/projects");
}

export async function deleteProjectAction(id: string) {
  const session = await getSession();
  if (!session) return;

  await deleteProject(id, session.userId);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
}
