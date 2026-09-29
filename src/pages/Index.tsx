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
    const description = lang === "ar"
      ? `عيادة متخصصة في العلاج الوظيفي للأطفال بخبرة أكثر من ${site.experience_years} سنوات. رعاية شخصية للأطفال من عمر 3 حتى 18 عامًا، بالتعاون مع كلاليت. احجز موعدك الآن.`
      : lang === "he"
        ? `מרפאת ריפוי בעיסוק לילדים עם מעל ${site.experience_years} שנות ניסיון. טיפול מקצועי לילדים בגילאי 3–18, בשיתוף כללית. הזמינו תור עכשיו.`
        : `Pediatric occupational therapy clinic with over ${site.experience_years} years of experience. Specialized care for children ages 3–18, partnered with Clalit. Book your appointment now.`;
    const setMeta = (selector: string, value: string) => {
      document.querySelector(selector)?.setAttribute("content", value);
    };
    document.title = title;
    setMeta('meta[name="title"]', title);
    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);
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
