import { motion } from "framer-motion";
import { Heart, Phone, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-start">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xl font-bold">{t.common.logoLetter}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.common.clinicName}</h3>
                <p className="text-xs opacity-70">{t.common.forChildren}</p>
              </div>
            </div>
            <p className="text-sm opacity-70">{t.footer.tagline}</p>
          </div>

          <div className="text-center">
            <h4 className="font-semibold mb-4">{t.footer.quickLinks}</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm opacity-70">
              <a href="#about" className="hover:opacity-100 transition-opacity">{t.nav.about}</a>
              <a href="#services" className="hover:opacity-100 transition-opacity">{t.nav.services}</a>
              <a href="#booking" className="hover:opacity-100 transition-opacity">{t.nav.booking}</a>
              <a href="#contact" className="hover:opacity-100 transition-opacity">{t.nav.contact}</a>
            </div>
          </div>

          <div className="text-center md:text-end">
            <h4 className="font-semibold mb-4">{t.footer.contactUs}</h4>
            <div className="flex justify-center md:justify-end gap-4">
              <a href="tel:+972501234567" className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
                <Phone className="w-5 h-5" />
              </a>
              <a href="https://wa.me/972501234567" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors">
                <MessageCircle className="w-5 h-5 text-accent-foreground" />
              </a>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 pt-8 border-t border-primary-foreground/10 text-center"
        >
          <p className="text-sm opacity-70 flex items-center justify-center gap-2">
            {t.footer.madeWith} <Heart className="w-4 h-4 text-secondary fill-secondary" /> {t.footer.forChildren}
          </p>
          <p className="text-xs opacity-50 mt-2">
            © {currentYear} {t.common.clinicName}. {t.footer.rights}
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
