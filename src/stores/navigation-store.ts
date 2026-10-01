import { create } from "zustand";
import { apiFetch } from "@/lib/api-client";
import type { MasterMenu } from "@/types";

function normalizeNavigationMenus(menus: MasterMenu[]): MasterMenu[] {
  return menus
    .map((menu) =>
      menu.path === "/dashboard"
        ? { ...menu, name: "Dashboard", sortOrder: 0 }
        : menu
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

interface NavigationState {
  menus: MasterMenu[];
  sections: string[];
  isLoading: boolean;
  error: string | null;
  fetchMenus: () => Promise<void>;
  setMenus: (menus: MasterMenu[]) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  menus: [],
  sections: [],
  // The first render has no data yet, so it must be treated as loading rather
  // than as a genuinely empty navigation.
  isLoading: true,
  error: null,

  fetchMenus: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch("/api/privileges?mode=my-menus");
      if (!res.ok) throw new Error("Failed to fetch menus");
      const json = await res.json();
      if (json.data) {
        let menus: MasterMenu[] = [];
        let sections: string[] = [];

        if (Array.isArray(json.data)) {
          menus = normalizeNavigationMenus(json.data);
          sections = Array.from(new Set(menus.map((m) => m.section || "Planning")));
        } else if (json.data.menus && Array.isArray(json.data.menus)) {
          menus = normalizeNavigationMenus(json.data.menus);
          if (json.data.sections && Array.isArray(json.data.sections) && json.data.sections.length > 0) {
            // Keep ordered sections from database and add any extra sections from menus
            const menuSections = new Set(menus.map((m) => m.section || "Planning"));
            sections = [...json.data.sections];
            menuSections.forEach((s) => {
              if (!sections.includes(s)) sections.push(s);
            });
          } else {
            sections = Array.from(new Set(menus.map((m) => m.section || "Planning")));
          }
        }

        set({ menus, sections, isLoading: false });
      } else {
        set({ menus: [], sections: [], isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to fetch menus", isLoading: false });
    }
  },

  setMenus: (menus: MasterMenu[]) => {
    const normalizedMenus = normalizeNavigationMenus(menus);
    const sections = Array.from(
      new Set(normalizedMenus.map((m) => m.section || "Planning"))
    );
    set({ menus: normalizedMenus, sections });
  },
}));
