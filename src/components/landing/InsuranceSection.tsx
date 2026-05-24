import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, CheckCircle2, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const InsuranceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section id="insurance" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-l from-primary-soft/50 to-transparent" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t.insurance.tag}</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
              {t.insurance.titleStart} <span className="text-primary">{t.insurance.titleHighlight}</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{t.insurance.desc}</p>

            <div className="space-y-4 mb-8">
              {t.insurance.coverage.map((detail, index) => (
                <motion.div
                  key={detail}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-accent-soft flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-foreground">{detail}</span>
                </motion.div>
              ))}
            </div>

            <div className="bg-primary-soft/50 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">{t.insurance.otherInsuranceTitle}</p>
                <p className="text-sm text-muted-foreground">{t.insurance.otherInsuranceDesc}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="bg-card rounded-3xl p-8 md:p-12 shadow-card border border-border/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-4xl font-bold">כ</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">כללית</h3>
                    <p className="text-muted-foreground">Clalit</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-background rounded-xl p-5 flex items-center gap-4">
                    <Shield className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{t.insurance.coverageBadge}</p>
                      <p className="text-sm text-muted-foreground">{t.insurance.ageRange}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-primary">0-18</p>
                      <p className="text-xs text-muted-foreground">{t.insurance.ageGroupLabel}</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-accent">✓</p>
                      <p className="text-xs text-muted-foreground">{t.insurance.certifiedLabel}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-24 h-24 bg-secondary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
