import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Award, Clock, Heart, Shield, Users, Sparkles } from "lucide-react";

const features = [
  {
    icon: Award,
    title: "خبرة أكثر من 10 سنوات",
    description: "نمتلك خبرة واسعة في علاج الأطفال من مختلف الأعمار والحالات",
    color: "primary",
  },
  {
    icon: Heart,
    title: "نهج متخصص ومحب",
    description: "نتعامل مع كل طفل بحب ورعاية، ونخلق بيئة آمنة ومريحة",
    color: "secondary",
  },
  {
    icon: Shield,
    title: "تعاون مع كلاليت",
    description: "نعمل بالتعاون مع صندوق المرضى كلاليت للأطفال حتى 18 عامًا",
    color: "accent",
  },
  {
    icon: Users,
    title: "متابعة شخصية",
    description: "نقدم برنامج علاجي مخصص ومتابعة مستمرة لتقدم طفلك",
    color: "primary",
  },
  {
    icon: Clock,
    title: "مواعيد مرنة",
    description: "نوفر مواعيد متنوعة تناسب جدول عائلتك واحتياجاتكم",
    color: "secondary",
  },
  {
    icon: Sparkles,
    title: "بيئة علاجية محفزة",
    description: "عيادة مجهزة بأحدث الأدوات والألعاب العلاجية للأطفال",
    color: "accent",
  },
];

const colorVariants = {
  primary: "bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground",
  secondary: "bg-secondary-soft text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground",
  accent: "bg-accent-soft text-accent group-hover:bg-accent group-hover:text-accent-foreground",
};

export const WhyUsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why-us" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-40 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            لماذا تختارنا؟
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            نحن نضع طفلك في المقام الأول
          </h2>
          <p className="text-lg text-muted-foreground">
            نؤمن بأن كل طفل فريد ويستحق رعاية متخصصة. 
            إليك ما يميزنا عن غيرنا.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-2xl p-6 h-full border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${colorVariants[feature.color as keyof typeof colorVariants]}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
