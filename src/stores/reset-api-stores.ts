import { useMasterDataStore } from "./master-data-store";
import { useNavigationStore } from "./navigation-store";
import { usePrivilegesStore } from "./privileges-store";

export function resetApiStores() {
  useMasterDataStore.getState().reset();
  useNavigationStore.getState().reset();
  usePrivilegesStore.getState().reset();
}