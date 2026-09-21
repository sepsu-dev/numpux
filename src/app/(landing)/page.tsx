import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { FAQ } from "@/components/landing/faq";
import { WhyChooseUs } from "@/components/landing/why-choose-us";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden font-sans">
      {/* Programmer Ornaments / Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

      {/* Decorative Orbs */}
      <div className="fixed top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-blob" />
      <div className="fixed bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-blob [animation-delay:2s]" />
      <div className="fixed top-1/2 left-1/3 w-96 h-96 bg-accent/5 rounded-full blur-[150px] pointer-events-none animate-blob [animation-delay:4s]" />


      <main className="relative z-10">
        <Hero />
        <Features />
        <WhyChooseUs />
        <FAQ />
      </main>
    </div>
  );
}