import Image from "next/image";
import Link from "next/link";

interface SiteFooterProps {
  author: string;
}

export function SiteFooter({ author }: SiteFooterProps) {
  return (
    <footer className="py-12 bg-background border-t border-border/60">
      <div className="container max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-v2.png" alt="Numpux Logo" width={28} height={28} />
          <span className="text-sm font-bold tracking-tight text-foreground lowercase">
            {author.replace(" Team", "").toLowerCase()}
          </span>
        </Link>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {author}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
