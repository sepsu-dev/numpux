export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type TaskStatus = "To Do" | "In Progress" | "Review" | "Done";

export type IssueType = "Task" | "Bug" | "Story";

export type ProjectMemberRole = "Owner" | "Admin" | "Member" | "Viewer";

export type UserRole = "admin" | "user";

export type User = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  createdAt?: string;
};

export type MasterMenu = {
  id: string;
  code: string;
  name: string;
  path: string;
  icon?: string;
  section?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  submenus?: MasterMenu[];
};

export type MasterSection = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt?: string;
};

export type UserGroup = {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  createdAt?: string;
};

export type UserPrivilege = {
  id: string;
  groupId: string;
  menuId: string;
  canView: boolean;
};

export type ProjectGroup = {
  id: string;
  name: string; // 'owner' | 'admin' | 'member'
  displayName: string;
  description?: string;
  createdAt?: string;
};

export type ProjectPrivilege = {
  id: string;
  groupId: string;
  menuId: string;
  canView: boolean;
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
  userRole?: ProjectMemberRole;
};

export const PRIORITY_ORDER: Priority[] = ["Low", "Medium", "High", "Urgent"];