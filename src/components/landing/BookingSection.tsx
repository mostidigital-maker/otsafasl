import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, User, Phone, Baby, Clock, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface FormData {
  childName: string;
  childAge: string;
  parentName: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
}

export const BookingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    childName: "",
    childAge: "",
    parentName: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.childName || !formData.parentName || !formData.phone) {
      toast({ title: t.booking.errorTitle, description: t.booking.errorRequired, variant: "destructive" });
      return;
    }

    const phoneRegex = /^[\d\s\-+()]{9,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast({ title: t.booking.errorPhoneTitle, description: t.booking.errorPhoneDesc, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);

    toast({ title: t.booking.successTitle, description: t.booking.successDesc });
  };

  if (isSubmitted) {
    return (
      <section id="booking" className="py-20 md:py-32 bg-card relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t.booking.thanksTitle}</h2>
            <p className="text-lg text-muted-foreground mb-8">{t.booking.thanksDesc}</p>
            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
              {t.booking.bookAnother}
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t.booking.tag}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6">{t.booking.title}</h2>
          <p className="text-lg text-muted-foreground">{t.booking.desc}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit} className="bg-background rounded-3xl p-8 md:p-10 shadow-card border border-border/50">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="childName" className="flex items-center gap-2 text-foreground">
                  <Baby className="w-4 h-4 text-primary" />
                  {t.booking.childName} *
                </Label>
                <Input id="childName" name="childName" value={formData.childName} onChange={handleChange}
                  placeholder={t.booking.childNamePh} className="h-12 rounded-xl" maxLength={100} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="childAge" className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t.booking.childAge}
                </Label>
                <Input id="childAge" name="childAge" value={formData.childAge} onChange={handleChange}
                  placeholder={t.booking.childAgePh} className="h-12 rounded-xl" maxLength={10} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentName" className="flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-primary" />
                  {t.booking.parentName} *
                </Label>
                <Input id="parentName" name="parentName" value={formData.parentName} onChange={handleChange}
                  placeholder={t.booking.parentNamePh} className="h-12 rounded-xl" maxLength={100} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-foreground">
                  <Phone className="w-4 h-4 text-primary" />
                  {t.booking.phone} *
                </Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange}
                  placeholder={t.booking.phonePh} className="h-12 rounded-xl" maxLength={20} dir="ltr" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredDate" className="flex items-center gap-2 text-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t.booking.preferredDate}
                </Label>
                <Input id="preferredDate" name="preferredDate" type="date" value={formData.preferredDate}
                  onChange={handleChange} className="h-12 rounded-xl" dir="ltr" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredTime" className="flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  {t.booking.preferredTime}
                </Label>
                <Input id="preferredTime" name="preferredTime" type="time" value={formData.preferredTime}
                  onChange={handleChange} className="h-12 rounded-xl" dir="ltr" />
              </div>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full mt-8 gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
                  {t.booking.submitting}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {t.booking.submit}
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">{t.booking.callbackNote}</p>
          </form>
        </motion.div>
      </div>
    </section>
  );
};
