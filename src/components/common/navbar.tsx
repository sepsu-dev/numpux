import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  name?: string;
  showMenu?: boolean;
}

export function Navbar({ name = "Numpux", showMenu = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Numpux home">
          <Image src="/logo-v2.png" alt="" width={28} height={28} priority />
          <span className="text-base font-semibold tracking-[-0.02em]">{name}</span>
        </Link>

        {showMenu && (
          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-5 md:flex" aria-label="Main navigation">
              <a href="#workflow" className="text-sm text-muted-foreground hover:text-foreground">How it works</a>
              <a href="#principles" className="text-sm text-muted-foreground hover:text-foreground">Why Numpux</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground">FAQ</a>
            </nav>
            <span className="hidden h-5 w-px bg-border md:block" />
            <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary">Sign in</Link>
            <Link href="/register" className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export { Navbar as SiteHeader };
