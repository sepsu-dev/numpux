export type Priority = "Rendah" | "Sedang" | "Tinggi" | "Mendesak";

export type TaskStatus = "Belum Mulai" | "Proses" | "Peninjauan" | "Selesai";

export type Task = {
  id: string;
  projectId?: string;
  title: string;
  project: string;
  priority: Priority;
  date: string;
  status: TaskStatus;
  description?: string;
};

export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Aktif" | "Perencanaan" | "Selesai";
  tasks: number;
  progress: number;
};

export const PRIORITY_ORDER: Priority[] = ["Rendah", "Sedang", "Tinggi", "Mendesak"];