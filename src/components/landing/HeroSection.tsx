import { motion } from "framer-motion";
import { MessageCircle, Calendar, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-therapy.jpg";

export const HeroSection = () => {
  const scrollToBooking = () => {
    const element = document.querySelector("#booking");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const openWhatsApp = () => {
    window.open("https://wa.me/972501234567?text=مرحباً، أريد حجز موعد للعلاج الوظيفي", "_blank");
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-bl from-primary-soft via-background to-secondary-soft" />
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-right"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary-soft text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>خبرة أكثر من 10 سنوات</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              نساعد طفلك على{" "}
              <span className="text-primary">التطور والنمو</span>{" "}
              بأفضل طريقة
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              عيادة متخصصة في العلاج الوظيفي للأطفال. نقدم رعاية شخصية وبيئة آمنة 
              لمساعدة طفلك على تحسين مهاراته الحركية والتعليمية والحياتية.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                variant="hero"
                size="lg"
                onClick={scrollToBooking}
                className="gap-2"
              >
                <Calendar className="w-5 h-5" />
                احجز موعدك الآن
              </Button>
              <Button
                variant="whatsapp"
                size="lg"
                onClick={openWhatsApp}
                className="gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                تواصل عبر واتساب
              </Button>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 mt-10 justify-center lg:justify-start"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center">
                  <Heart className="w-5 h-5 text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">رعاية متخصصة</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">כ</span>
                </div>
                <span className="text-sm text-muted-foreground">تعاون مع كلاليت</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-card">
              <img
                src={heroImage}
                alt="معالجة وظيفية تعمل مع طفل في جلسة علاجية"
                className="w-full h-auto object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
            </div>

            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-card border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                  <span className="text-secondary-foreground text-2xl">👶</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">+500</p>
                  <p className="text-xs text-muted-foreground">طفل سعيد</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
