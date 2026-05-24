import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Hand, BookOpen, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const icons = [Hand, Brain, BookOpen, Users];

export const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section id="about" className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t.about.tag}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">{t.about.title}</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">{t.about.desc}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {t.about.benefits.map((benefit, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="bg-background rounded-2xl p-6 h-full border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card">
                  <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-gradient-to-l from-primary-soft to-accent-soft rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t.about.ctaTitle}</h3>
              <p className="text-muted-foreground leading-relaxed">{t.about.ctaDesc}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {t.about.stats.map((stat, i) => (
                <div key={i} className="bg-card rounded-2xl p-5 text-center shadow-soft">
                  <p className={`text-3xl font-bold ${i === 0 ? "text-primary" : i === 1 ? "text-secondary" : i === 2 ? "text-accent" : "text-foreground"}`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
