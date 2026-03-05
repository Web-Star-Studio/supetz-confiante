import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import VisualProofSection from "@/components/landing/VisualProofSection";
import ProblemSection from "@/components/landing/ProblemSection";
import NaturalTreatmentSection from "@/components/landing/NaturalTreatmentSection";
import ThemesGallery from "@/components/landing/ThemesGallery";
import TestimonialsShowcaseSection from "@/components/landing/TestimonialsShowcaseSection";
import TreatmentPlansSection from "@/components/landing/TreatmentPlansSection";
import PurchaseSecuritySection from "@/components/landing/PurchaseSecuritySection";
import FAQStandaloneSection from "@/components/landing/FAQStandaloneSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

const Index = () => {
  return (
    <Layout>
      <div className="relative overflow-hidden">
        <HeroSection />
        <BenefitsSection />
        <VisualProofSection />
        <ProblemSection />
        <NaturalTreatmentSection />
        <ThemesGallery />
        <TestimonialsShowcaseSection />
        <TreatmentPlansSection />
        <PurchaseSecuritySection />
        <FAQStandaloneSection />
        <FinalCTASection />
      </div>
    </Layout>
  );
};

export default Index;
