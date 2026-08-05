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
          <Image src="/logo-v2.png" alt="Numpux Logo" width={34} height={34} />
          <span className="text-md font-black tracking-tight text-foreground lowercase">
            {author.replace(" Team", "").toLowerCase()}
          </span>
        </Link>

        {/* No navigation links */}

        <p className="text-[11px] font-bold text-muted-foreground/60">
          © {new Date().getFullYear()} {author}. Hak cipta dilindungi undang-undang.
        </p>
      </div>
    </footer>
  );
}
