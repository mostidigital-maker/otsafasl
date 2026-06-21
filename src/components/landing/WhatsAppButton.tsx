import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export const WhatsAppButton = () => {
  const { t, dir } = useLanguage();

  const openWhatsApp = () => {
    const message = encodeURIComponent(t.common.whatsappMessage);
    window.open(`https://wa.me/972505772680?text=${message}`, "_blank");
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      onClick={openWhatsApp}
      className="fixed bottom-6 start-6 z-50 w-14 h-14 rounded-full bg-accent shadow-card hover:shadow-glow flex items-center justify-center transition-all duration-300 hover:scale-110 group"
      aria-label={t.common.contactWhatsapp}
    >
      <MessageCircle className="w-7 h-7 text-accent-foreground" />

      <div className={`absolute ${dir === "rtl" ? "right-full mr-3" : "left-full ml-3"} px-3 py-2 bg-card rounded-lg shadow-card border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none`}>
        <span className="text-sm text-foreground">{t.common.contactWhatsapp}</span>
      </div>

      <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
    </motion.button>
  );
};
