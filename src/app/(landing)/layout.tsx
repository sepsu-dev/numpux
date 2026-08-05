import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <SiteHeader name="Numpux" />
            <main className="flex-1">
                {children}
            </main>
            <SiteFooter author="Numpux Team" />
        </div>
    );
}
