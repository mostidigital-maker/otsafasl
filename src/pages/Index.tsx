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
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { lang } = useLanguage();
  const site = useSiteSettings();

  useEffect(() => {
    const title = lang === "ar"
      ? `عيادة العلاج الوظيفي للأطفال | خبرة أكثر من ${site.experience_years} سنوات`
      : lang === "he"
        ? `מרפאת ריפוי בעיסוק לילדים | מעל ${site.experience_years} שנות ניסיון`
        : `Pediatric Occupational Therapy Clinic | Over ${site.experience_years} years of experience`;
    document.title = title;
    document.querySelector('meta[name="title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", title);
  }, [lang, site.experience_years]);

  return (
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
  );
};

export default Index;
