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
  reorderStatuses: (items: MasterStatusItem[]) => Promise<boolean>;
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
  if (!response.ok) throw new Error(body.message || "Master data request failed");
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
      const message = error instanceof Error ? error.message : "Failed to save master data";
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
      set({ error: error instanceof Error ? error.message : "Failed to load master data" });
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
      if (get().categories.some((item) => item.toLowerCase() === trimmed.toLowerCase())) { toast.error("Category name already exists"); return false; }
      return mutate("POST", { resource: resource("categories"), item: { id: crypto.randomUUID(), name: trimmed } }, `Category "${trimmed}" was added`);
    },
    updateCategory: async (idx, name) => {
      const item = get().categoryItems[idx];
      const trimmed = name.trim();
      if (!item || !trimmed) return false;
      return mutate("PUT", { resource: resource("categories"), id: item.id, updates: { name: trimmed } }, "Category was updated");
    },
    removeCategory: async (name) => {
      const item = get().categoryItems.find((category) => category.name === name);
      if (!item) return false;
      return mutate("DELETE", { resource: resource("categories"), id: item.id }, `Category "${name}" was deleted`);
    },
    addIssueType: (item) => mutate("POST", { resource: resource("issueTypes"), item }, `Issue type "${item.name}" was added`),
    updateIssueType: (id, updates) => mutate("PUT", { resource: resource("issueTypes"), id, updates }, "Issue type was updated"),
    removeIssueType: (id) => mutate("DELETE", { resource: resource("issueTypes"), id }, "Issue type was deleted"),
    addPriority: (item) => mutate("POST", { resource: resource("priorities"), item }, `Priority "${item.name}" was added`),
    updatePriority: (id, updates) => mutate("PUT", { resource: resource("priorities"), id, updates }, "Priority was updated"),
    removePriority: (id) => mutate("DELETE", { resource: resource("priorities"), id }, "Priority was deleted"),
    addStatus: (item) => mutate("POST", { resource: resource("statuses"), item }, `Status "${item.name}" was added`),
    updateStatus: (id, updates) => mutate("PUT", { resource: resource("statuses"), id, updates }, "Status was updated"),
    reorderStatuses: async (items) => {
      set({ isSaving: true, error: null, statuses: items.map((item, index) => ({ ...item, order: index + 1 })) });
      try {
        await Promise.all(items.map(async (item, index) =>
          readResponse(await apiFetch("/api/master-data", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resource: resource("statuses"), id: item.id, updates: { order: index + 1 } }),
          }))
        ));
        await get().loadAll(true);
        window.dispatchEvent(new Event("numpux_master_data_updated"));
        toast.success("Task status order was updated");
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save status order";
        set({ error: message });
        await get().loadAll(true);
        toast.error(message);
        return false;
      } finally { set({ isSaving: false }); }
    },
    removeStatus: (id) => mutate("DELETE", { resource: resource("statuses"), id }, "Status was deleted"),
    addProjectStatus: (item) => mutate("POST", { resource: resource("projectStatuses"), item }, `Project status "${item.name}" was added`),
    updateProjectStatus: (id, updates) => mutate("PUT", { resource: resource("projectStatuses"), id, updates }, "Project status was updated"),
    removeProjectStatus: (id) => mutate("DELETE", { resource: resource("projectStatuses"), id }, "Project status was deleted"),
  };
});
