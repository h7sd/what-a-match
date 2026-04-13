import { ChangelogSection } from "@/components/landing/ChangelogSection";
import { ModernHeader } from "@/components/landing/ModernHeader";
import { ModernFooter } from "@/components/landing/ModernFooter";

export default function Changelog() {
  return (
    <div className="min-h-screen bg-background">
      <ModernHeader />
      <ChangelogSection />
      <ModernFooter />
    </div>
  );
}
