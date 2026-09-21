import type { Task, Project } from "@/lib/types";

// Store in-memory
type Store = { tasks: Task[]; projects: Project[] };
const g = globalThis as unknown as { numpuxStore?: Store };

const PROJECT_UUIDS = {
  numpuxEngine: "b3f8a42c-5d96-419b-a012-78d91c130001",
  situsMarketing: "e1a924cd-870b-4221-a3f1-432d56a20002",
  aplikasiNumpux: "74c10c12-302a-4df5-91db-fcbe9d150003",
};

const seedProjects: Project[] = [
  {
    id: PROJECT_UUIDS.numpuxEngine,
    title: "Numpux Engine",
    description: "Sistem inti untuk manajemen tugas real-time.",
    category: "Sistem",
    status: "Aktif",
    tasks: 3,
    progress: 33,
  },
  {
    id: PROJECT_UUIDS.situsMarketing,
    title: "Situs Marketing",
    description: "Halaman utama dan dokumentasi publik.",
    category: "Konten",
    status: "Perencanaan",
    tasks: 1,
    progress: 0,
  },
  {
    id: PROJECT_UUIDS.aplikasiNumpux,
    title: "Aplikasi Numpux",
    description: "Aplikasi mobile dan desktop untuk pengguna.",
    category: "Produk",
    status: "Aktif",
    tasks: 1,
    progress: 0,
  },
];

const seedTasks: Task[] = [
  {
    id: "a1100001-1111-4000-8000-000000000001",
    projectId: PROJECT_UUIDS.numpuxEngine,
    title: "Refactor spaghetti code di auth service",
    project: "Numpux Engine",
    priority: "Tinggi",
    date: "Hari ini",
    status: "Proses",
  },
  {
    id: "a1100001-1111-4000-8000-000000000002",
    projectId: PROJECT_UUIDS.numpuxEngine,
    title: "Fix bug 'Works on my machine' di Dockerfile",
    project: "Numpux Engine",
    priority: "Sedang",
    date: "Besok",
    status: "Belum Mulai",
  },
  {
    id: "a1100001-1111-4000-8000-000000000003",
    projectId: PROJECT_UUIDS.numpuxEngine,
    title: "Optimize query database Numpux",
    project: "Numpux Engine",
    priority: "Mendesak",
    date: "24 Mei",
    status: "Selesai",
  },
  {
    id: "a1100001-1111-4000-8000-000000000004",
    projectId: PROJECT_UUIDS.situsMarketing,
    title: "Tulis dokumentasi API dengan Swagger",
    project: "Situs Marketing",
    priority: "Rendah",
    date: "25 Mei",
    status: "Peninjauan",
  },
  {
    id: "a1100001-1111-4000-8000-000000000005",
    projectId: PROJECT_UUIDS.aplikasiNumpux,
    title: "Argue about spaces vs tabs",
    project: "Aplikasi Numpux",
    priority: "Sedang",
    date: "Besok",
    status: "Belum Mulai",
  },
];

g.numpuxStore ??= {
  tasks: seedTasks.map((t) => ({ ...t })),
  projects: seedProjects.map((p) => ({ ...p })),
};
const store = g.numpuxStore;

function recalculateProjectStats(projectId?: string) {
  if (!projectId) return;
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return;
  const projectTasks = store.tasks.filter((t) => t.projectId === projectId);
  project.tasks = projectTasks.length;
  const completed = projectTasks.filter((t) => t.status === "Selesai").length;
  project.progress = projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0;
}

export function listTasks(projectId?: string) {
  if (projectId) {
    return store.tasks.filter((t) => t.projectId === projectId);
  }
  return store.tasks;
}

export function getTask(id: string) {
  return store.tasks.find((t) => t.id === id);
}

export function createTask(input: Omit<Task, "id">) {
  const task: Task = {
    ...input,
    id: crypto.randomUUID(),
  };
  store.tasks.unshift(task);
  if (task.projectId) {
    recalculateProjectStats(task.projectId);
  }
  return task;
}

export function updateTask(id: string, input: Partial<Omit<Task, "id">>) {
  const task = getTask(id);
  if (!task) return undefined;
  const oldProjectId = task.projectId;
  Object.assign(task, input);
  if (task.projectId) recalculateProjectStats(task.projectId);
  if (oldProjectId && oldProjectId !== task.projectId) recalculateProjectStats(oldProjectId);
  return task;
}

export function deleteTask(id: string) {
  const task = getTask(id);
  const projectId = task?.projectId;
  store.tasks = store.tasks.filter((t) => t.id !== id);
  if (projectId) recalculateProjectStats(projectId);
}

export function listProjects() {
  return store.projects;
}

export function getProject(id: string) {
  return store.projects.find((p) => p.id === id);
}

export function createProject(input: Omit<Project, "id">) {
  const project: Project = {
    ...input,
    id: crypto.randomUUID(),
    tasks: 0,
    progress: 0,
  };
  store.projects.unshift(project);
  return project;
}

export function updateProject(id: string, input: Partial<Omit<Project, "id">>) {
  const project = getProject(id);
  if (!project) return undefined;
  Object.assign(project, input);
  return project;
}

export function deleteProject(id: string) {
  store.projects = store.projects.filter((p) => p.id !== id);
  store.tasks = store.tasks.filter((t) => t.projectId !== id);
}