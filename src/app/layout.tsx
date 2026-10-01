import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@/app/globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateMetadata(): Metadata {
  return {
    title: {
      default: "Numpux — Projects and tasks, kept clear",
      template: "%s — Numpux",
    },
    description:
      "Plan projects, organize tasks, and keep work moving in one clear workspace.",
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${manrope.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <NextTopLoader showSpinner={false} color="#078a55" height={2} />
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
