import { create } from "zustand";
import {
  getMasterCategories,
  saveMasterCategories,
  getMasterIssueTypes,
  saveMasterIssueTypes,
  getMasterPriorities,
  saveMasterPriorities,
  type MasterIssueTypeItem,
  type MasterPriorityItem,
} from "@/lib/master-data";
import { toast } from "sonner";

interface MasterDataState {
  // Categories
  categories: string[];
  loadCategories: () => void;
  addCategory: (name: string) => boolean;
  updateCategory: (idx: number, newName: string) => void;
  removeCategory: (cat: string) => boolean;

  // Issue Types
  issueTypes: MasterIssueTypeItem[];
  loadIssueTypes: () => void;
  addIssueType: (item: MasterIssueTypeItem) => boolean;
  removeIssueType: (id: string) => boolean;

  // Priorities
  priorities: MasterPriorityItem[];
  loadPriorities: () => void;
  addPriority: (item: MasterPriorityItem) => boolean;
  removePriority: (id: string) => boolean;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => ({
  // Categories
  categories: [],
  loadCategories: () => {
    set({ categories: getMasterCategories() });
  },
  addCategory: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const current = get().categories;
    if (current.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Nama kategori sudah ada");
      return false;
    }
    const updated = [...current, trimmed];
    if (!saveMasterCategories(updated)) {
      toast.error("Kategori gagal disimpan");
      return false;
    }
    set({ categories: updated });
    toast.success(`Kategori "${trimmed}" berhasil ditambahkan`);
    return true;
  },
  updateCategory: (idx: number, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const current = get().categories;
    if (idx < 0 || idx >= current.length) return;
    if (current.some((category, categoryIdx) => categoryIdx !== idx && category.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Nama kategori sudah ada");
      return;
    }
    const updated = [...current];
    updated[idx] = trimmed;
    if (!saveMasterCategories(updated)) {
      toast.error("Kategori gagal disimpan");
      return;
    }
    set({ categories: updated });
    toast.success("Kategori berhasil diperbarui");
  },
  removeCategory: (cat: string) => {
    const current = get().categories;
    if (current.length <= 1) {
      toast.error("Minimal harus menyisakan 1 kategori");
      return false;
    }
    const updated = current.filter((c) => c !== cat);
    if (!saveMasterCategories(updated)) {
      toast.error("Kategori gagal dihapus");
      return false;
    }
    set({ categories: updated });
    toast.success(`Kategori "${cat}" berhasil dihapus`);
    return true;
  },

  // Issue Types
  issueTypes: [],
  loadIssueTypes: () => {
    set({ issueTypes: getMasterIssueTypes() });
  },
  addIssueType: (item: MasterIssueTypeItem) => {
    const current = get().issueTypes;
    if (current.some((t) => t.name.toLowerCase() === item.name.toLowerCase())) {
      toast.error("Issue type name already exists");
      return false;
    }
    const updated = [...current, item];
    if (!saveMasterIssueTypes(updated)) {
      toast.error("Issue type could not be saved");
      return false;
    }
    set({ issueTypes: updated });
    toast.success(`Issue type "${item.name}" created`);
    return true;
  },
  removeIssueType: (id: string) => {
    const current = get().issueTypes;
    if (current.length <= 1) {
      toast.error("You must keep at least 1 issue type");
      return false;
    }
    const updated = current.filter((t) => t.id !== id);
    if (!saveMasterIssueTypes(updated)) {
      toast.error("Issue type could not be removed");
      return false;
    }
    set({ issueTypes: updated });
    toast.success("Issue type removed");
    return true;
  },

  // Priorities
  priorities: [],
  loadPriorities: () => {
    set({ priorities: getMasterPriorities() });
  },
  addPriority: (item: MasterPriorityItem) => {
    const current = get().priorities;
    if (current.some((p) => p.name.toLowerCase() === item.name.toLowerCase())) {
      toast.error("Priority name already exists");
      return false;
    }
    const updated = [...current, item];
    if (!saveMasterPriorities(updated)) {
      toast.error("Priority could not be saved");
      return false;
    }
    set({ priorities: updated });
    toast.success(`Priority "${item.name}" created`);
    return true;
  },
  removePriority: (id: string) => {
    const current = get().priorities;
    if (current.length <= 1) {
      toast.error("You must keep at least 1 priority");
      return false;
    }
    const updated = current.filter((p) => p.id !== id);
    if (!saveMasterPriorities(updated)) {
      toast.error("Priority could not be removed");
      return false;
    }
    set({ priorities: updated });
    toast.success("Priority removed");
    return true;
  },
}));
