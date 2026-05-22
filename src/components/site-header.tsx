"use client";

import Image from "next/image";
import Link from "next/link";

interface SiteHeaderProps {
  name: string;
  showMenu?: boolean;
}

export function SiteHeader({ name, showMenu = true }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
      <div className="container max-w-5xl mx-auto px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="Numpux Logo"
            width={36}
            height={36}
            className="group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-[20px] font-black tracking-tight text-[#0A0A0A]">{name}</span>
        </Link>

        {showMenu && (
          <>
            {/* Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-[13px] font-bold text-muted-foreground hover:text-[#0A0A0A] transition-colors">Fitur</Link>
              <Link href="#pricing" className="text-[13px] font-bold text-muted-foreground hover:text-[#0A0A0A] transition-colors">Harga</Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[13px] font-black text-muted-foreground hover:text-[#0A0A0A] transition-colors hidden sm:block">
                Masuk
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-sm bg-[#0A0A0A] text-white font-black text-[13px] hover:bg-accent transition-colors shadow-[3px_3px_0_0_rgba(168,85,247,0.3)] hover:shadow-none active:scale-95"
              >
                Daftar Gratis
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
