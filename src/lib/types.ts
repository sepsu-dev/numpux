export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";

export type IssueType = "Task" | "Bug" | "Story";

export type ProjectMemberRole = "Owner" | "Admin" | "Member" | "Viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

export type ProjectMember = {
  id: string;
  projectId: string;
  userId: string;
  name: string;
  email: string;
  role: ProjectMemberRole;
  createdAt?: string;
};

export type TaskActivity = {
  id: string;
  taskId: string;
  userId?: string;
  userName: string;
  action: string;
  details?: string;
  createdAt: string;
};

export type Task = {
  id: string;
  key?: string; // e.g. "NUM-12"
  userId?: string;
  projectId: string;
  issueType?: IssueType;
  title: string;
  project: string;
  priority: Priority;
  date?: string;
  status: TaskStatus;
  description?: string;
  createdAt?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
};

export type Project = {
  id: string;
  userId?: string;
  title: string;
  description: string;
  category: string;
  status: "Active" | "Planning" | "Completed";
  tasks: number;
  progress: number;
  membersCount?: number;
};

export const PRIORITY_ORDER: Priority[] = ["Low", "Medium", "High", "Urgent"];