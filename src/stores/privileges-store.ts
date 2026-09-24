import { create } from "zustand";
import { apiFetch } from "@/lib/api-client";
import { toast } from "sonner";
import type { MasterMenu, MasterSection, UserGroup, UserPrivilege, ProjectGroup, ProjectPrivilege } from "@/types";

interface PrivilegesState {
  menus: MasterMenu[];
  sections: MasterSection[];
  userGroups: UserGroup[];
  userPrivileges: Array<UserPrivilege & { groupName: string; menuCode: string; menuName: string }>;
  projectGroups: ProjectGroup[];
  projectPrivileges: Array<ProjectPrivilege & { groupName: string; menuCode: string; menuName: string }>;
  isLoading: boolean;
  error: string | null;

  loadAllPrivileges: () => Promise<void>;
  toggleUserPrivilege: (groupName: string, menuId: string, currentVal: boolean) => Promise<boolean>;
  toggleProjectPrivilege: (groupName: string, menuId: string, currentVal: boolean) => Promise<boolean>;
  addProjectGroup: (data: { name: string; displayName: string; description?: string }) => Promise<boolean>;
  removeProjectGroup: (id: string) => Promise<boolean>;
  addMenu: (data: { name: string; path: string; icon?: string; section?: string; parentId?: string | null }) => Promise<boolean>;
  removeMenu: (id: string) => Promise<boolean>;
  updateMenu: (id: string, updates: Partial<MasterMenu>) => Promise<boolean>;
  reorderMenus: (newMenus: MasterMenu[]) => Promise<boolean>;
  addSection: (name: string) => Promise<boolean>;
  updateSection: (id: string, name: string) => Promise<boolean>;
  removeSection: (id: string) => Promise<boolean>;
  reorderSections: (newSections: MasterSection[]) => Promise<boolean>;
}

export const usePrivilegesStore = create<PrivilegesState>((set, get) => ({
  menus: [],
  sections: [],
  userGroups: [],
  userPrivileges: [],
  projectGroups: [],
  projectPrivileges: [],
  isLoading: false,
  error: null,

  loadAllPrivileges: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch("/api/privileges");
      const json = await res.json();
      if (json.data) {
        set({
          menus: json.data.menus || [],
          sections: json.data.sections || [],
          userGroups: json.data.groups || [],
          userPrivileges: json.data.privileges || [],
          projectGroups: json.data.projectGroups || [],
          projectPrivileges: json.data.projectPrivileges || [],
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || "Failed to load privileges", isLoading: false });
    }
  },

  toggleUserPrivilege: async (groupName: string, menuId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    const currentPrivs = get().userPrivileges;
    const targetGroup = get().userGroups.find((g) => g.name === groupName);

    // Optimistic update
    if (targetGroup) {
      set({
        userPrivileges: currentPrivs.map((p) =>
          p.groupId === targetGroup.id && p.menuId === menuId
            ? { ...p, canView: newVal }
            : p
        ),
      });
    }

    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "user",
          groupName,
          menuId,
          canView: newVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success(`Akses diperbarui untuk ${groupName}`);
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        // Revert on error
        set({ userPrivileges: currentPrivs });
        toast.error(data.message || "Gagal memperbarui privilege");
        return false;
      }
    } catch {
      // Revert on error
      set({ userPrivileges: currentPrivs });
      toast.error("Network error while updating privilege");
      return false;
    }
  },

  toggleProjectPrivilege: async (groupName: string, menuId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    const currentPrivs = get().projectPrivileges;
    const targetGroup = get().projectGroups.find((g) => g.name === groupName);

    // Optimistic update
    if (targetGroup) {
      set({
        projectPrivileges: currentPrivs.map((p) =>
          p.groupId === targetGroup.id && p.menuId === menuId
            ? { ...p, canView: newVal }
            : p
        ),
      });
    }

    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          groupName,
          menuId,
          canView: newVal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        toast.success(`Akses project diperbarui untuk ${groupName}`);
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        // Revert on error
        set({ projectPrivileges: currentPrivs });
        toast.error(data.message || "Gagal memperbarui privilege project");
        return false;
      }
    } catch {
      // Revert on error
      set({ projectPrivileges: currentPrivs });
      toast.error("Network error while updating project privilege");
      return false;
    }
  },

  addProjectGroup: async (data: { name: string; displayName: string; description?: string }) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_project_group",
          name: data.name,
          displayName: data.displayName,
          description: data.description,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success(`Role "${data.displayName}" berhasil ditambahkan`);
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal membuat role project");
        return false;
      }
    } catch {
      toast.error("Network error while creating project role");
      return false;
    }
  },

  removeProjectGroup: async (id: string) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "delete_project_group",
          id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success("Role project berhasil dihapus");
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal menghapus role project");
        return false;
      }
    } catch {
      toast.error("Network error while deleting project role");
      return false;
    }
  },

  addMenu: async (data: { name: string; path: string; icon?: string; section?: string; parentId?: string | null }) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_menu",
          name: data.name,
          path: data.path,
          icon: data.icon,
          section: data.section,
          parentId: data.parentId || null,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success(`Menu "${data.name}" berhasil dibuat`);
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal membuat menu baru");
        return false;
      }
    } catch {
      toast.error("Network error while creating menu");
      return false;
    }
  },

  removeMenu: async (id: string) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "delete_menu",
          id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success("Menu berhasil dihapus");
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal menghapus menu");
        return false;
      }
    } catch {
      toast.error("Network error while deleting menu");
      return false;
    }
  },

  updateMenu: async (id: string, updates: Partial<MasterMenu>) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "menu",
          id,
          ...updates,
        }),
      });
      if (res.ok) {
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  reorderMenus: async (newMenus: MasterMenu[]) => {
    set({ menus: newMenus });
    try {
      await Promise.all(
        newMenus.map((item, idx) =>
          apiFetch("/api/privileges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "menu",
              id: item.id,
              name: item.name,
              sortOrder: idx + 1,
            }),
          })
        )
      );
      await get().loadAllPrivileges();
      window.dispatchEvent(new Event("numpux_master_data_updated"));
      return true;
    } catch {
      toast.error("Failed to reorder menus");
      return false;
    }
  },

  addSection: async (name: string) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_section",
          name,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success(`Section "${name}" berhasil dibuat`);
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal membuat section baru");
        return false;
      }
    } catch {
      toast.error("Network error while creating section");
      return false;
    }
  },

  updateSection: async (id: string, name: string) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_section",
          id,
          name,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success("Section berhasil diperbarui");
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal memperbarui section");
        return false;
      }
    } catch {
      toast.error("Network error while updating section");
      return false;
    }
  },

  removeSection: async (id: string) => {
    try {
      const res = await apiFetch("/api/privileges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "delete_section",
          id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.status === "success") {
        toast.success("Section berhasil dihapus");
        await get().loadAllPrivileges();
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        return true;
      } else {
        toast.error(json.message || "Gagal menghapus section");
        return false;
      }
    } catch {
      toast.error("Network error while deleting section");
      return false;
    }
  },

  reorderSections: async (newSections: MasterSection[]) => {
    set({ sections: newSections });
    try {
      await Promise.all(
        newSections.map((sec, idx) =>
          apiFetch("/api/privileges", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "update_section",
              id: sec.id,
              name: sec.name,
              sortOrder: idx + 1,
            }),
          })
        )
      );
      await get().loadAllPrivileges();
      window.dispatchEvent(new Event("numpux_master_data_updated"));
      return true;
    } catch {
      toast.error("Gagal mengubah urutan section");
      return false;
    }
  },
}));
