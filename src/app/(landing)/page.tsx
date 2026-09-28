import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { FAQ } from "@/components/landing/faq";
import { WhyChooseUs } from "@/components/landing/why-choose-us";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-background font-sans">
      <Hero />
      <Features />
      <WhyChooseUs />
      <FAQ />
    </main>
  );
}
