import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Award, Clock, Heart, Shield, Users, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const icons = [Award, Heart, Shield, Users, Clock, Sparkles];
const colors = ["primary", "secondary", "accent", "primary", "secondary", "accent"] as const;
const colorVariants: Record<string, string> = {
  primary: "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  secondary: "bg-secondary-soft text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground",
  accent: "bg-accent-soft text-accent group-hover:bg-accent group-hover:text-accent-foreground",
};

export const WhyUsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section id="why-us" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t.whyUs.tag}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">{t.whyUs.title}</h2>
          <p className="text-lg text-muted-foreground">{t.whyUs.desc}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.whyUs.features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-card rounded-2xl p-6 h-full border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${colorVariants[colors[index]]}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
