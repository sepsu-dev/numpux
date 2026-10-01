import {
  BookmarkSimple,
  Bug,
  CheckSquare,
  Fire,
  Lightning,
  Rocket,
  Shield,
  type Icon,
} from "@phosphor-icons/react";

export type IssueTypeIconName =
  | "CheckSquare"
  | "Bug"
  | "BookmarkSimple"
  | "Lightning"
  | "Shield"
  | "Fire"
  | "Rocket";

export interface MasterCategoryItem { id: string; name: string; isDefault?: boolean; }
export interface MasterIssueTypeItem { id: string; name: string; description?: string; iconName: IssueTypeIconName; colorClass: string; isDefault?: boolean; }
export interface MasterPriorityItem { id: string; name: string; level: number; dotColor: string; badgeClass: string; severityClass: string; isDefault?: boolean; }
export interface MasterStatusItem { id: string; name: string; description?: string; order: number; dotColor: string; badgeClass: string; headerBorder: string; isCompleted: boolean; isDefault?: boolean; }
export interface MasterProjectStatusItem { id: string; name: string; description?: string; colorClass: string; order: number; isCompleted: boolean; isDefault?: boolean; }

export const ISSUE_TYPE_ICONS: Record<IssueTypeIconName, Icon> = {
  CheckSquare, Bug, BookmarkSimple, Lightning, Shield, Fire, Rocket,
};

export function getStatusConfig(statuses: MasterStatusItem[], statusId?: string): MasterStatusItem {
  const requested = statusId || statuses[0]?.id || "Unknown";
  return statuses.find((status) => status.id.toLowerCase() === requested.toLowerCase()) || {
    id: requested, name: requested, description: "Workflow status", order: statuses.length + 1,
    dotColor: "bg-muted-foreground", badgeClass: "bg-muted text-muted-foreground",
    headerBorder: "border-border", isCompleted: false,
  };
}

export function getIssueTypeConfig(issueTypes: MasterIssueTypeItem[], typeId?: string) {
  const found = issueTypes.find((type) => type.id.toLowerCase() === (typeId || "").toLowerCase()) || issueTypes[0];
  return {
    icon: found ? ISSUE_TYPE_ICONS[found.iconName] || CheckSquare : CheckSquare,
    colorClass: found?.colorClass || "text-muted-foreground bg-muted border-border",
    name: found?.name || typeId || "Task",
  };
}

export function getPriorityConfig(priorities: MasterPriorityItem[], priorityName?: string) {
  const requested = priorityName || "";
  const found = priorities.find((priority) => priority.id.toLowerCase() === requested.toLowerCase() || priority.name.toLowerCase() === requested.toLowerCase()) || priorities[0];
  return {
    label: found?.name || priorityName || "Priority",
    dotClass: found?.dotColor || "bg-muted-foreground",
    badgeClass: found?.badgeClass || "bg-muted text-muted-foreground border-border",
  };
}
