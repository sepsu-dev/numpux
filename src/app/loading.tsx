import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Image src="/logo-v2.png" alt="" width={24} height={24} />
        <span>Loading…</span>
      </div>
    </div>
  );
}
