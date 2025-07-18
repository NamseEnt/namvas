import { HeroSection } from "./sections/HeroSection";
import { PreviewSection } from "./sections/PreviewSection";
import { SpecsSection } from "./sections/SpecsSection";
import { OrderInfoSection } from "./sections/OrderInfoSection";
import { ContactSection } from "./sections/ContactSection";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <PreviewSection />
      <SpecsSection />
      <OrderInfoSection />
      <ContactSection />
    </div>
  );
}