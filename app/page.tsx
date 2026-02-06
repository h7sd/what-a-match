import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { BentoFeatures } from "@/components/landing/bento-features"
import { ClaimSection } from "@/components/landing/claim-section"
import { FAQSection } from "@/components/landing/faq-section"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="min-h-screen relative bg-background overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />
        <main>
          <HeroSection />
          <BentoFeatures />
          <ClaimSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </div>
  )
}
