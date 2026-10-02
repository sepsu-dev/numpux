"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, deleteSession, getSession } from "@/lib/session";
import { initDb } from "@/db";
import { findUserByEmail, createUser, getUserSessionVersion, markUserLogin, verifyAndUpgradePassword } from "@/lib/user-db";
import { checkRateLimit } from "@/lib/rate-limit";
import { createTask, createProject, deleteTask, deleteProject, updateTask } from "@/lib/store";
import type { TaskStatus } from "@/types";
import { findAllMasterData } from "@/app/(backend)/api/master-data/query";

export type AuthState = { errors?: Record<string, string[]>; message?: string } | undefined;

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
  redirectTo: z.string().optional(),
});

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo") || undefined,
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "local";
  const rateLimit = checkRateLimit(`action-login:${ip}`, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { message: `Too many sign-in attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };
  }

  await initDb();
  const { email, password, redirectTo } = validated.data;
  const user = await findUserByEmail(email.trim().toLowerCase());

  if (!user || !(await verifyAndUpgradePassword(user.id, password, user.password_hash))) {
    return { message: "Invalid email or password" };
  }
  if (user.accountStatus !== "active") {
    return { message: "This account is suspended. Contact your administrator." };
  }

  await markUserLogin(user.id);
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
    sessionVersion: await getUserSessionVersion(user.id),
  });
  const safeRedirect = redirectTo?.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/dashboard";
  redirect(safeRedirect);
}

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  invitationToken: z.string().optional(),
});

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const validated = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    invitationToken: formData.get("invitationToken") || undefined,
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim()
    || requestHeaders.get("x-real-ip")
    || "local";
  const rateLimit = checkRateLimit(`action-register:${ip}`, 5, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return { message: `Too many registration attempts. Try again in ${rateLimit.retryAfterSeconds} seconds.` };
  }

  await initDb();
  const { name, email, password, invitationToken } = validated.data;
  const existingUser = await findUserByEmail(email.trim().toLowerCase());
  if (existingUser) {
    return { message: "An account with this email already exists" };
  }

  let invitation = null;
  if (invitationToken) {
    const { findInvitationByToken } = await import("@/lib/invitations");
    invitation = await findInvitationByToken(invitationToken);
    if (!invitation || invitation.status !== "pending" || new Date(invitation.expiresAt).getTime() <= Date.now()) {
      return { message: "This invitation is invalid or has expired" };
    }
    if (invitation.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { message: "Use the email address that received this invitation" };
    }
  }
  const invitedRegistration = invitationToken
    ? await (await import("@/lib/invitations")).registerInvitedUser({ token: invitationToken, name, email, password })
    : null;
  const newUser = invitedRegistration?.user || await createUser(name.trim(), email.trim().toLowerCase(), password, "user", "self_registered");
  const acceptedProjectId = invitedRegistration?.projectId || null;
  if (!invitationToken) await markUserLogin(newUser.id);
  await createSession({
    userId: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role || "user",
    sessionVersion: await getUserSessionVersion(newUser.id),
  });
  redirect(acceptedProjectId ? `/tasks/kanban?projectId=${acceptedProjectId}` : "/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const taskSchema = z.object({
  title: z.string().min(1, { message: "Task title is required" }),
  projectId: z.string().min(1, { message: "Project is required" }),
  project: z.string().optional().default(""),
  priority: z.string().trim().min(1).max(50).optional(),
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

  const { title, projectId, date, description } = parsed.data;
  const masterData = await findAllMasterData();
  const priority = parsed.data.priority || masterData.priorities[0]?.id;
  const status = masterData.statuses[0]?.id;
  const issueType = masterData.issueTypes[0]?.id;
  if (!priority || !status || !issueType) return { errors: { priority: ["Task configuration is incomplete"] } };
  let projectName = parsed.data.project;
  const { getProject } = await import("@/lib/store");
  const proj = await getProject(projectId, session.userId);
  if (proj) projectName = proj.title;
  const { canContributeToProject, findProjectAccess } = await import("@/lib/workspace");
  const access = await findProjectAccess(session.userId, projectId);
  if (!access || !canContributeToProject(access.projectRole)) {
    return { errors: { projectId: ["You do not have permission to create tasks in this project"] } };
  }

  await createTask(
    {
      title,
      projectId,
      project: projectName || "Project",
      priority,
      date: date.trim() ? date.trim() : undefined,
      status,
      issueType,
      description: description || undefined,
    },
    session.userId
  );

  revalidatePath("/tasks/backlog");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect("/tasks/backlog");
}

export async function deleteTaskAction(id: string) {
  const session = await getSession();
  if (!session) return;

  await deleteTask(id, session.userId);
  revalidatePath("/tasks/backlog");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function updateTaskStatusAction(id: string, status: string) {
  const session = await getSession();
  if (!session) return;

  const normalizedStatus = status.trim();
  if (!normalizedStatus || normalizedStatus.length > 50) return;
  const { getTask } = await import("@/lib/store");
  const task = await getTask(id, session.userId);
  if (!task) return;
  const { canContributeToProject, findProjectAccess } = await import("@/lib/workspace");
  const access = await findProjectAccess(session.userId, task.projectId);
  if (!access || !canContributeToProject(access.projectRole)) return;
  await updateTask(id, { status: normalizedStatus as TaskStatus }, session.userId);
  revalidatePath("/tasks/backlog");
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
    { title, category, description, tasks: 0, progress: 0 },
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
  revalidatePath("/tasks/backlog");
}
