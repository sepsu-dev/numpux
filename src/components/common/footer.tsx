import Image from "next/image";
import Link from "next/link";

interface FooterProps { author?: string }

export function Footer({ author = "Numpux Team" }: FooterProps) {
  return (
    <footer className="border-t border-border/70 bg-[#f7f8f3]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8 lg:px-10">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-v2.png" alt="Numpux" width={24} height={24} />
            <span className="font-heading text-sm font-medium text-foreground">numpux</span>
          </Link>
          <span className="text-border">·</span>
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} {author}</p>
        </div>

        <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
          <Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link>
          <Link href="/register" className="transition-colors hover:text-foreground">Get started</Link>
        </div>
      </div>
    </footer>
  );
}

export { Footer as SiteFooter };
