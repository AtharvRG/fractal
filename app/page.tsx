import { BenefitRow } from "../components/landing/benefit-row";
import { Footer } from "../components/landing/footer";
import { HeroSection } from "../components/landing/hero";
import { PreviewStrip } from "../components/landing/preview-strip";

export default function LandingPage() {
  return (
    // The main container for the landing page content
    <div className="w-full flex flex-col items-center">
      {/* Add vertical padding and increase gap for better section separation */}
      <main className="flex min-h-screen w-full max-w-7xl flex-col items-center gap-28 md:gap-40 px-4 py-24 md:py-32">
        <HeroSection />
        <PreviewStrip />
        <BenefitRow />
      </main>
      <Footer />
    </div>
  );
}