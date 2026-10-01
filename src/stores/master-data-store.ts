import { create } from "zustand";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-client";
import type { MasterCategoryItem, MasterIssueTypeItem, MasterPriorityItem, MasterProjectStatusItem, MasterStatusItem } from "@/lib/master-data";

type Resource = "categories" | "issueTypes" | "priorities" | "statuses" | "projectStatuses";
interface MasterDataPayload { categories: MasterCategoryItem[]; issueTypes: MasterIssueTypeItem[]; priorities: MasterPriorityItem[]; statuses: MasterStatusItem[]; projectStatuses: MasterProjectStatusItem[]; }
interface MasterDataState {
  categories: string[];
  categoryItems: MasterCategoryItem[];
  issueTypes: MasterIssueTypeItem[];
  priorities: MasterPriorityItem[];
  statuses: MasterStatusItem[];
  projectStatuses: MasterProjectStatusItem[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  hasLoaded: boolean;
  loadAll: (force?: boolean) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadIssueTypes: () => Promise<void>;
  loadPriorities: () => Promise<void>;
  loadStatuses: () => Promise<void>;
  loadProjectStatuses: () => Promise<void>;
  addCategory: (name: string) => Promise<boolean>;
  updateCategory: (idx: number, name: string) => Promise<boolean>;
  removeCategory: (name: string) => Promise<boolean>;
  addIssueType: (item: MasterIssueTypeItem) => Promise<boolean>;
  updateIssueType: (id: string, updates: Partial<Omit<MasterIssueTypeItem, "id">>) => Promise<boolean>;
  removeIssueType: (id: string) => Promise<boolean>;
  addPriority: (item: MasterPriorityItem) => Promise<boolean>;
  updatePriority: (id: string, updates: Partial<Omit<MasterPriorityItem, "id">>) => Promise<boolean>;
  removePriority: (id: string) => Promise<boolean>;
  addStatus: (item: MasterStatusItem) => Promise<boolean>;
  updateStatus: (id: string, updates: Partial<Omit<MasterStatusItem, "id">>) => Promise<boolean>;
  removeStatus: (id: string) => Promise<boolean>;
  addProjectStatus: (item: MasterProjectStatusItem) => Promise<boolean>;
  updateProjectStatus: (id: string, updates: Partial<Omit<MasterProjectStatusItem, "id">>) => Promise<boolean>;
  removeProjectStatus: (id: string) => Promise<boolean>;
}

function payloadToState(payload: MasterDataPayload) {
  return { categoryItems: payload.categories, categories: payload.categories.map((item) => item.name), issueTypes: payload.issueTypes, priorities: payload.priorities, statuses: payload.statuses, projectStatuses: payload.projectStatuses };
}

async function readResponse(response: Response): Promise<{ data?: MasterDataPayload; message?: string }> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Permintaan master data gagal");
  return body;
}

export const useMasterDataStore = create<MasterDataState>((set, get) => {
  const mutate = async (method: "POST" | "PUT" | "DELETE", body: Record<string, unknown>, successMessage: string) => {
    set({ isSaving: true, error: null });
    try {
      const result = await readResponse(await apiFetch("/api/master-data", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
      if (result.data) set({ ...payloadToState(result.data), hasLoaded: true });
      toast.success(successMessage);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Master data gagal disimpan";
      set({ error: message });
      toast.error(message);
      return false;
    } finally { set({ isSaving: false }); }
  };

  const loadAll = async (force = false) => {
    if (get().isLoading || (get().hasLoaded && !force)) return;
    set({ isLoading: true, error: null });
    try {
      const result = await readResponse(await apiFetch("/api/master-data", { cache: "no-store" }));
      if (result.data) set({ ...payloadToState(result.data), hasLoaded: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Master data gagal dimuat" });
    } finally { set({ isLoading: false }); }
  };

  const resource = (name: Resource) => name;
  return {
    categories: [], categoryItems: [], issueTypes: [], priorities: [], statuses: [], projectStatuses: [],
    isLoading: false, isSaving: false, error: null, hasLoaded: false,
    loadAll,
    loadCategories: () => loadAll(), loadIssueTypes: () => loadAll(), loadPriorities: () => loadAll(), loadStatuses: () => loadAll(), loadProjectStatuses: () => loadAll(),
    addCategory: async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return false;
      if (get().categories.some((item) => item.toLowerCase() === trimmed.toLowerCase())) { toast.error("Nama kategori sudah ada"); return false; }
      return mutate("POST", { resource: resource("categories"), item: { id: crypto.randomUUID(), name: trimmed } }, `Kategori "${trimmed}" berhasil ditambahkan`);
    },
    updateCategory: async (idx, name) => {
      const item = get().categoryItems[idx];
      const trimmed = name.trim();
      if (!item || !trimmed) return false;
      return mutate("PUT", { resource: resource("categories"), id: item.id, updates: { name: trimmed } }, "Kategori berhasil diperbarui");
    },
    removeCategory: async (name) => {
      const item = get().categoryItems.find((category) => category.name === name);
      if (!item) return false;
      return mutate("DELETE", { resource: resource("categories"), id: item.id }, `Kategori "${name}" berhasil dihapus`);
    },
    addIssueType: (item) => mutate("POST", { resource: resource("issueTypes"), item }, `Issue type "${item.name}" berhasil ditambahkan`),
    updateIssueType: (id, updates) => mutate("PUT", { resource: resource("issueTypes"), id, updates }, "Issue type berhasil diperbarui"),
    removeIssueType: (id) => mutate("DELETE", { resource: resource("issueTypes"), id }, "Issue type berhasil dihapus"),
    addPriority: (item) => mutate("POST", { resource: resource("priorities"), item }, `Priority "${item.name}" berhasil ditambahkan`),
    updatePriority: (id, updates) => mutate("PUT", { resource: resource("priorities"), id, updates }, "Priority berhasil diperbarui"),
    removePriority: (id) => mutate("DELETE", { resource: resource("priorities"), id }, "Priority berhasil dihapus"),
    addStatus: (item) => mutate("POST", { resource: resource("statuses"), item }, `Status "${item.name}" berhasil ditambahkan`),
    updateStatus: (id, updates) => mutate("PUT", { resource: resource("statuses"), id, updates }, "Status berhasil diperbarui"),
    removeStatus: (id) => mutate("DELETE", { resource: resource("statuses"), id }, "Status berhasil dihapus"),
    addProjectStatus: (item) => mutate("POST", { resource: resource("projectStatuses"), item }, `Status project "${item.name}" berhasil ditambahkan`),
    updateProjectStatus: (id, updates) => mutate("PUT", { resource: resource("projectStatuses"), id, updates }, "Status project berhasil diperbarui"),
    removeProjectStatus: (id) => mutate("DELETE", { resource: resource("projectStatuses"), id }, "Status project berhasil dihapus"),
  };
});
