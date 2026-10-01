import {
  Bell, ChartBar, ChartLineUp, CheckSquare, Columns, Flag, FolderSimple, Gear, ListDashes,
  ListNumbers, Rows, ShieldCheck, SlidersHorizontal, SquaresFour, Stack, Tag,
  Trash, User, UsersThree, type Icon,
} from "@phosphor-icons/react";

export const MENU_ICON_OPTIONS: Array<{ name: string; label: string; icon: Icon }> = [
  { name: "SquaresFour", label: "Board", icon: SquaresFour },
  { name: "ChartLineUp", label: "Analytics", icon: ChartLineUp },
  { name: "ChartBar", label: "Monitoring", icon: ChartBar },
  { name: "Bell", label: "Notifications", icon: Bell },
  { name: "ListDashes", label: "List", icon: ListDashes },
  { name: "FolderSimple", label: "Folder", icon: FolderSimple },
  { name: "Stack", label: "Stack", icon: Stack },
  { name: "ListNumbers", label: "Numbered list", icon: ListNumbers },
  { name: "ShieldCheck", label: "Security", icon: ShieldCheck },
  { name: "UsersThree", label: "Users", icon: UsersThree },
  { name: "User", label: "User", icon: User },
  { name: "Tag", label: "Tag", icon: Tag },
  { name: "CheckSquare", label: "Task", icon: CheckSquare },
  { name: "Flag", label: "Flag", icon: Flag },
  { name: "Columns", label: "Columns", icon: Columns },
  { name: "Rows", label: "Rows", icon: Rows },
  { name: "SlidersHorizontal", label: "Controls", icon: SlidersHorizontal },
  { name: "Gear", label: "Settings", icon: Gear },
  { name: "Trash", label: "Trash", icon: Trash },
];

export const MENU_ICONS: Record<string, Icon> = Object.fromEntries(MENU_ICON_OPTIONS.map((item) => [item.name, item.icon]));
export function getMenuIcon(name?: string): Icon { return MENU_ICONS[name || ""] || FolderSimple; }
