import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Navbar name="Numpux" />
            <div className="flex-1">{children}</div>
            <Footer author="Numpux Team" />
        </div>
    );
}
