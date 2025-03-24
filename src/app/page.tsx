import { Benefits } from "@/components/landing/benefits";
import { CTA } from "@/components/landing/cta";
import { EquipmentCategories } from "@/components/landing/equipment-categories";
import { Features } from "@/components/landing/features";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/howItWorks";
import { Simulator } from "@/components/landing/simulator";
import { Testimonials } from "@/components/landing/testimonials";
import { Footer } from "@/components/shared/footer";
import { Header } from "@/components/shared/header";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Benefits />
        <EquipmentCategories />
        <HowItWorks />
        <Simulator />
        <Features />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
