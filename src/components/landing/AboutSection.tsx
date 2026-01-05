import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Hand, BookOpen, Users } from "lucide-react";

const benefits = [
  {
    icon: Hand,
    title: "المهارات الحركية",
    description: "تطوير المهارات الحركية الدقيقة والكبيرة للطفل",
  },
  {
    icon: Brain,
    title: "التركيز والانتباه",
    description: "تحسين القدرة على التركيز والانتباه في المهام اليومية",
  },
  {
    icon: BookOpen,
    title: "الأداء الأكاديمي",
    description: "دعم الطفل في تحسين أدائه المدرسي والتعليمي",
  },
  {
    icon: Users,
    title: "المهارات الاجتماعية",
    description: "تعزيز التفاعل الاجتماعي والتواصل مع الآخرين",
  },
];

export const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-20 md:py-32 bg-card relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">
            عن العلاج الوظيفي
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">
            ما هو العلاج الوظيفي للأطفال؟
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            العلاج الوظيفي هو تخصص طبي يساعد الأطفال على تطوير المهارات اللازمة 
            للقيام بالأنشطة اليومية بشكل مستقل. نعمل على تحسين القدرات الحركية، 
            الحسية، والإدراكية لطفلك في بيئة آمنة وداعمة.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-background rounded-2xl p-6 h-full border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card">
                <div className="w-14 h-14 rounded-2xl bg-primary-soft flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <benefit.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 bg-gradient-to-l from-primary-soft to-accent-soft rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                كيف يساعد العلاج الوظيفي طفلك؟
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                من خلال جلسات علاجية مصممة خصيصًا لاحتياجات طفلك، نعمل على تطوير 
                قدراته بطريقة ممتعة وفعالة. نستخدم الألعاب والأنشطة التفاعلية 
                لتحقيق أهداف علاجية محددة.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-5 text-center shadow-soft">
                <p className="text-3xl font-bold text-primary">10+</p>
                <p className="text-sm text-muted-foreground mt-1">سنوات خبرة</p>
              </div>
              <div className="bg-card rounded-2xl p-5 text-center shadow-soft">
                <p className="text-3xl font-bold text-secondary">500+</p>
                <p className="text-sm text-muted-foreground mt-1">طفل تم علاجه</p>
              </div>
              <div className="bg-card rounded-2xl p-5 text-center shadow-soft">
                <p className="text-3xl font-bold text-accent">98%</p>
                <p className="text-sm text-muted-foreground mt-1">رضا الأهالي</p>
              </div>
              <div className="bg-card rounded-2xl p-5 text-center shadow-soft">
                <p className="text-3xl font-bold text-foreground">∞</p>
                <p className="text-sm text-muted-foreground mt-1">حب ورعاية</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
