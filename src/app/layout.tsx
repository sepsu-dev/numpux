import type { Metadata } from "next";
import { Inter, Fredoka } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["300", "400", "500", "600", "700"],
});

export function generateMetadata(): Metadata {
  return {
    title: {
      default: "Numpux",
      template: `%s — Numpux`,
    },
    description: "Numpux",
  };
}

import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${fredoka.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased font-sans min-h-screen bg-background text-foreground">
        <NextTopLoader showSpinner={false} color="#6366f1" />
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
