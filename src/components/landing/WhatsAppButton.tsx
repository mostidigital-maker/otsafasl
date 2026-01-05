import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export const WhatsAppButton = () => {
  const openWhatsApp = () => {
    window.open("https://wa.me/972501234567?text=مرحباً، أريد حجز موعد للعلاج الوظيفي", "_blank");
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      onClick={openWhatsApp}
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-accent shadow-card hover:shadow-glow flex items-center justify-center transition-all duration-300 hover:scale-110 group"
      aria-label="تواصل عبر واتساب"
    >
      <MessageCircle className="w-7 h-7 text-accent-foreground" />
      
      {/* Tooltip */}
      <div className="absolute left-full mr-3 px-3 py-2 bg-card rounded-lg shadow-card border border-border/50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        <span className="text-sm text-foreground">تواصل عبر واتساب</span>
      </div>

      {/* Pulse Animation */}
      <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30" />
    </motion.button>
  );
};
