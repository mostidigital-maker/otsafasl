import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Phone, MessageCircle, Clock, MapPin, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const whatsappMessage = encodeURIComponent(t.common.whatsappMessage);

  const contactInfo = [
    { icon: Phone, label: t.contact.phoneLabel, value: "050-123-4567", href: "tel:+972501234567", isWhatsApp: false },
    { icon: MessageCircle, label: t.contact.whatsappLabel, value: t.contact.whatsappValue, href: `https://wa.me/972501234567?text=${whatsappMessage}`, isWhatsApp: true },
    { icon: Mail, label: t.contact.emailLabel, value: "info@ot-clinic.com", href: "mailto:info@ot-clinic.com", isWhatsApp: false },
  ];

  const workingHours = [
    { day: t.contact.days.weekdays, hours: "08:00 - 18:00" },
    { day: t.contact.days.friday, hours: "08:00 - 13:00" },
    { day: t.contact.days.saturday, hours: t.contact.closed },
  ];

  return (
    <section id="contact" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t.contact.tag}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">{t.contact.title}</h2>
          <p className="text-lg text-muted-foreground">{t.contact.desc}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {contactInfo.map((item, index) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.isWhatsApp ? "_blank" : undefined}
                rel={item.isWhatsApp ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className={`group block bg-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card ${item.isWhatsApp ? "hover:border-accent/30" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${item.isWhatsApp ? "bg-accent-soft group-hover:bg-accent" : "bg-primary-soft group-hover:bg-primary"}`}>
                    <item.icon className={`w-7 h-7 transition-colors ${item.isWhatsApp ? "text-accent group-hover:text-accent-foreground" : "text-primary group-hover:text-primary-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="font-bold text-foreground text-lg">{item.value}</p>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-soft">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t.contact.hoursTitle}</h3>
              </div>
              <div className="space-y-4">
                {workingHours.map((item) => (
                  <div key={item.day} className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
                    <span className="text-foreground font-medium">{item.day}</span>
                    <span className={`${item.hours === t.contact.closed ? "text-destructive" : "text-muted-foreground"}`}>
                      {item.hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-soft flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">{t.contact.locationTitle}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t.contact.address}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
