import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { WhyUsSection } from "@/components/landing/WhyUsSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { InsuranceSection } from "@/components/landing/InsuranceSection";
import { BookingSection } from "@/components/landing/BookingSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { LanguageProvider } from "@/contexts/LanguageContext";

const Index = () => {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background font-cairo">
        <Header />
        <main>
          <HeroSection />
          <AboutSection />
          <WhyUsSection />
          <ServicesSection />
          <InsuranceSection />
          <BookingSection />
          <ContactSection />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </LanguageProvider>
  );
};

export default Index;
