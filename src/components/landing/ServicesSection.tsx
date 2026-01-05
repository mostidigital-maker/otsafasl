import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Dumbbell, Focus, GraduationCap, Puzzle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Dumbbell,
    title: "علاج صعوبات المهارات الحركية",
    description: "نساعد الأطفال على تطوير التنسيق الحركي، التوازن، والمهارات الحركية الدقيقة مثل الكتابة والرسم وإمساك الأشياء.",
    features: ["التوازن والتنسيق", "المهارات الحركية الدقيقة", "قوة العضلات"],
  },
  {
    icon: Focus,
    title: "علاج صعوبات التركيز والانتباه",
    description: "نعمل على تحسين قدرة الطفل على التركيز، التنظيم، والتخطيط للمهام اليومية والدراسية.",
    features: ["تحسين الانتباه", "التنظيم الذاتي", "إدارة الوقت"],
  },
  {
    icon: GraduationCap,
    title: "تحسين المهارات الأكاديمية والحياتية",
    description: "ندعم الطفل في تطوير مهارات القراءة، الكتابة، والاستقلالية في الأنشطة اليومية.",
    features: ["مهارات الكتابة", "الاستقلالية", "العناية الذاتية"],
  },
  {
    icon: Puzzle,
    title: "برامج علاجية شخصية",
    description: "نصمم برنامج علاجي خاص لكل طفل بناءً على احتياجاته الفردية وأهداف العلاج المحددة.",
    features: ["تقييم شامل", "أهداف محددة", "متابعة مستمرة"],
  },
];

export const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const scrollToBooking = () => {
    const element = document.querySelector("#booking");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="services" className="py-20 md:py-32 bg-card relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            خدماتنا
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            خدمات علاجية متكاملة لطفلك
          </h2>
          <p className="text-lg text-muted-foreground">
            نقدم مجموعة شاملة من الخدمات العلاجية المصممة لمساعدة طفلك 
            على تحقيق أقصى إمكاناته.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group"
            >
              <div className="bg-background rounded-3xl p-8 h-full border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-card">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-soft group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-8 h-8 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {service.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 bg-primary-soft text-primary text-sm rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <Button
            variant="default"
            size="lg"
            onClick={scrollToBooking}
            className="gap-2"
          >
            احجز جلسة تقييم الآن
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
