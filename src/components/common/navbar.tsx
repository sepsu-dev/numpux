"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

interface NavbarProps { name?: string; showMenu?: boolean }

export function Navbar({ name = "Numpux", showMenu = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[#f7f8f3]">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Numpux home">
          <Image src="/logo-v2.png" alt="" width={32} height={32} className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105" priority />
          <span className="font-heading text-xl font-medium tracking-[-0.025em] text-foreground">{name}</span>
        </Link>

        {showMenu && (
          <>
            <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
              <a href="#workflow" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">How it works</a>
              <a href="#principles" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">Who it is for</a>
              <a href="#faq" className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">FAQ</a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="hidden px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">Sign in</Link>
              <Link href="/register" className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-white transition-colors hover:bg-[#067a4b]">
                Start for free <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" weight="bold" />
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export { Navbar as SiteHeader };
