import Image from "next/image";
import Link from "next/link";

interface FooterProps {
  author?: string;
}

export function Footer({ author = "Numpux" }: FooterProps) {
  const brand = author.replace(" Team", "");

  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-v2.png" alt="" width={24} height={24} />
          <span className="text-sm font-semibold">{brand}</span>
        </Link>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {brand}
        </p>
      </div>
    </footer>
  );
}

export { Footer as SiteFooter };
