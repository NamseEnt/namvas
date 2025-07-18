import { HeroSection } from "./sections/HeroSection";
import { PreviewSection } from "./sections/PreviewSection";
import { PortfolioSection } from "./sections/PortfolioSection";
import { SpecsSection } from "./sections/SpecsSection";
import { OrderInfoSection } from "./sections/OrderInfoSection";
import { ContactSection } from "./sections/ContactSection";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <PreviewSection />
      <PortfolioSection />
      <SpecsSection />
      <OrderInfoSection />
      <ContactSection />
    </div>
  );
}