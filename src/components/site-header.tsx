"use client";

import Image from "next/image";
import Link from "next/link";

interface SiteHeaderProps {
  name: string;
  showMenu?: boolean;
}

export function SiteHeader({ name, showMenu = true }: SiteHeaderProps) {
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
          /* CTA Button (No navigation links) */
          <div className="flex items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl lime-glow-button text-primary-foreground font-semibold text-[13px] transition-transform active:scale-95 shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
