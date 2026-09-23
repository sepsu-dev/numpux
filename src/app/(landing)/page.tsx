import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { FAQ } from "@/components/landing/faq";
import { WhyChooseUs } from "@/components/landing/why-choose-us";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-sans">
      {/* Programmer subtle grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

      <main className="relative z-10">
        <Hero />
        <Features />
        <WhyChooseUs />
        <FAQ />
      </main>
    </div>
  );
}