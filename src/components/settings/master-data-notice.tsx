import { Database, WarningCircle } from "@phosphor-icons/react";

export function MasterDataNotice({ isLoading, error }: { isLoading: boolean; error: string | null }) {
  if (!isLoading && !error) return null;
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card px-4 py-3 text-xs text-muted-foreground" role="status">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
        <span>Synchronizing configuration from database...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-xs text-rose-600" role="alert">
      <WarningCircle size={16} weight="fill" />
      <span>{error}</span>
      <Database size={15} className="ml-auto opacity-60" />
    </div>
  );
}
