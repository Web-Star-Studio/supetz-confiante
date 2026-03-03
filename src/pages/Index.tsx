import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FloatingDots from "@/components/landing/FloatingDots";

const Index = () => {
  return (
    <Layout>
      <div className="relative">
        <FloatingDots />
        <HeroSection />
        <BenefitsSection />
        <PricingSection />
        <FAQSection />
      </div>
    </Layout>
  );
};

export default Index;
