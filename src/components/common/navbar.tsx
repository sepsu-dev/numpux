"use client";

import Image from "next/image";
import Link from "next/link";

interface NavbarProps {
  name?: string;
  showMenu?: boolean;
}

export function Navbar({ name = "Numpux", showMenu = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container max-w-5xl mx-auto px-6 flex h-20 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo-v2.png"
            alt="Numpux Logo"
            width={34}
            height={34}
            className="group-hover:rotate-12 transition-transform duration-300"
          />
          <span className="text-[20px] font-bold tracking-tight text-foreground font-sans lowercase">{name.toLowerCase()}</span>
        </Link>

        {showMenu && (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-all hover:bg-primary/90 active:scale-98 shadow-2xs"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export { Navbar as SiteHeader };
