import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/SEOHead";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import VisualProofSection from "@/components/landing/VisualProofSection";
import ProblemSection from "@/components/landing/ProblemSection";
import NaturalTreatmentSection from "@/components/landing/NaturalTreatmentSection";
import ResultsTimeline from "@/components/landing/ResultsTimeline";
import VetEndorsement from "@/components/landing/VetEndorsement";
import ThemesGallery from "@/components/landing/ThemesGallery";
import TestimonialsShowcaseSection from "@/components/landing/TestimonialsShowcaseSection";
import TreatmentPlansSection from "@/components/landing/TreatmentPlansSection";
import PurchaseSecuritySection from "@/components/landing/PurchaseSecuritySection";
import FAQStandaloneSection from "@/components/landing/FAQStandaloneSection";
import NewsletterSection from "@/components/landing/NewsletterSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="Supet — Gomas Naturais para Coceira, Alergia e Queda de Pelo do Seu Cão"
        description="Supet: gomas 100% naturais com ômega 3, biotina e colágeno que acabam com coceiras, alergias e queda de pelo do seu cão em até 30 dias. Aprovado por veterinários. Frete grátis."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Supet",
            "url": "https://supetz-playful-trust.lovable.app",
            "logo": "https://supetz-playful-trust.lovable.app/favicon.png",
            "description": "Gomas 100% naturais para a saúde do seu pet.",
            "sameAs": []
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Supet",
            "url": "https://supetz-playful-trust.lovable.app",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://supetz-playful-trust.lovable.app/shop?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        ]}
      />
      <div className="relative overflow-hidden">
        <HeroSection />
        <BenefitsSection />
        <VisualProofSection />
        <ProblemSection />
        <NaturalTreatmentSection />
        <ResultsTimeline />
        <ThemesGallery />
        <VetEndorsement />
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
