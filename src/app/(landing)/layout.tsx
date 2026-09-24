import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Navbar name="Numpux" />
            <main className="flex-1">
                {children}
            </main>
            <Footer author="Numpux Team" />
        </div>
    );
}
