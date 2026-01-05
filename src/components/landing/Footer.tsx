import { motion } from "framer-motion";
import { Heart, Phone, MessageCircle } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Logo & Description */}
          <div className="text-center md:text-right">
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xl font-bold">ع</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">عيادة العلاج الوظيفي</h3>
                <p className="text-xs opacity-70">للأطفال</p>
              </div>
            </div>
            <p className="text-sm opacity-70">
              نساعد طفلك على التطور والنمو بأفضل طريقة
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <div className="flex flex-wrap justify-center gap-4 text-sm opacity-70">
              <a href="#about" className="hover:opacity-100 transition-opacity">عن العلاج الوظيفي</a>
              <a href="#services" className="hover:opacity-100 transition-opacity">خدماتنا</a>
              <a href="#booking" className="hover:opacity-100 transition-opacity">حجز موعد</a>
              <a href="#contact" className="hover:opacity-100 transition-opacity">تواصل معنا</a>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-4">تواصل معنا</h4>
            <div className="flex justify-center md:justify-start gap-4">
              <a
                href="tel:+972501234567"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href="https://wa.me/972501234567"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-accent-foreground" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-12 pt-8 border-t border-primary-foreground/10 text-center"
        >
          <p className="text-sm opacity-70 flex items-center justify-center gap-2">
            صُنع بـ <Heart className="w-4 h-4 text-secondary fill-secondary" /> لأطفالنا الأحباء
          </p>
          <p className="text-xs opacity-50 mt-2">
            © {currentYear} عيادة العلاج الوظيفي للأطفال. جميع الحقوق محفوظة.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
