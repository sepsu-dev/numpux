import Image from "next/image";
import Link from "next/link";

interface SiteFooterProps {
  author: string;
}

export function SiteFooter({ author }: SiteFooterProps) {
  return (
    <footer className="py-16 bg-stone-50 border-t border-border relative overflow-hidden">
      <div className="container max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-8 relative z-10">
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo-v2.png" alt="Numpux Logo" width={32} height={32} />
          <span className="text-base font-bold tracking-tight text-foreground lowercase">
            {author.replace(" Team", "").toLowerCase()}
          </span>
        </Link>

        {/* No navigation links */}

        <p className="text-xs font-normal text-muted-foreground/80">
          © {new Date().getFullYear()} {author}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
