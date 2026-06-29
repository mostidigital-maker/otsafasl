import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle, MapPin, Calendar as CalIcon, Clock, ChevronRight, ChevronLeft, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { computeSlots, getAvailableDates, useAvailability, type SlotOption } from "@/hooks/useAvailableSlots";
import { cn } from "@/lib/utils";

interface Location {
  id: string;
  slug: string;
  name_ar: string;
  name_he: string;
  name_en: string;
}

type Step = 1 | 2 | 3 | 4;

export const BookingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { toast } = useToast();
  const { t, lang, dir } = useLanguage();

  const [locations, setLocations] = useState<Location[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ childName: "", childAge: "", parentName: "", phone: "", email: "" });

  useEffect(() => {
    supabase.from("locations").select("*").order("sort_order").then(({ data }) => {
      if (data) setLocations(data as Location[]);
    });
  }, []);

  const { workingHours, blocked, taken, loading } = useAvailability(locationId);
  const availableDates = useMemo(
    () => getAvailableDates(locationId, workingHours, blocked, taken),
    [locationId, workingHours, blocked, taken],
  );
  const slotsForDay = useMemo(
    () => (selectedDate && locationId ? computeSlots(selectedDate, locationId, workingHours, blocked, taken) : []),
    [selectedDate, locationId, workingHours, blocked, taken],
  );

  const selectedLocation = locations.find((l) => l.id === locationId);
  const locName = (loc?: Location) => (!loc ? "" : loc[`name_${lang}` as const]);

  const reset = () => {
    setStep(1); setLocationId(null); setSelectedDate(undefined); setSelectedSlot(null);
    setForm({ childName: "", childAge: "", parentName: "", phone: "", email: "" });
    setDone(false);
  };

  const submit = async () => {
    if (!form.childName || !form.parentName || !form.phone || !form.email || !selectedSlot || !locationId) {
      toast({ title: t.booking.errorTitle, description: t.booking.errorRequired, variant: "destructive" });
      return;
    }
    if (!/^[\d\s\-+()]{9,15}$/.test(form.phone)) {
      toast({ title: t.booking.errorPhoneTitle, description: t.booking.errorPhoneDesc, variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: t.booking.errorEmailTitle, description: t.booking.errorEmailDesc, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.from("appointments").insert({
      location_id: locationId,
      slot_at: selectedSlot.iso,
      child_name: form.childName.trim(),
      child_age: form.childAge.trim() || null,
      parent_name: form.parentName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      language: lang,
    }).select().single();
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: t.booking.errorSlotTitle, description: t.booking.errorSlotDesc, variant: "destructive" });
        setStep(3); setSelectedSlot(null);
      } else {
        toast({ title: t.booking.errorTitle, description: error.message, variant: "destructive" });
      }
      return;
    }
    // Fire-and-forget email notification
    supabase.functions.invoke("notify-appointment", {
      body: { appointment_id: data!.id, kind: "received" },
    }).catch(() => {});
    setDone(true);
  };

  if (done) {
    return (
      <section id="booking" className="py-20 md:py-32 bg-card">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 rounded-full bg-accent-soft flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.booking.thanksTitle}</h2>
            <p className="text-lg text-muted-foreground mb-8">{t.booking.thanksDesc}</p>
            <Button variant="outline" onClick={reset}>{t.booking.bookAnother}</Button>
          </motion.div>
        </div>
      </section>
    );
  }

  const Stepper = () => {
    const steps = [
      { n: 1, label: t.booking.stepLocation, icon: MapPin },
      { n: 2, label: t.booking.stepDate, icon: CalIcon },
      { n: 3, label: t.booking.stepTime, icon: Clock },
      { n: 4, label: t.booking.stepDetails, icon: Send },
    ];
    return (
      <div className="flex items-center justify-between mb-8 gap-2">
        {steps.map((s, i) => (
          <div key={s.n} className="flex-1 flex items-center">
            <div className={cn("flex flex-col items-center gap-1 flex-1", step >= s.n ? "text-primary" : "text-muted-foreground")}>
              <div className={cn("w-9 h-9 rounded-full flex items-center justify-center border-2", step >= s.n ? "bg-primary text-primary-foreground border-primary" : "border-border")}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] md:text-xs font-medium text-center hidden sm:block">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={cn("h-0.5 flex-1", step > s.n ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>
    );
  };

  const Back = ({ to }: { to: Step }) => (
    <Button type="button" variant="outline" onClick={() => setStep(to)} className="gap-2">
      {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      {t.booking.back}
    </Button>
  );
  const Next = ({ to, disabled }: { to: Step; disabled?: boolean }) => (
    <Button type="button" onClick={() => setStep(to)} disabled={disabled} className="gap-2">
      {t.booking.next}
      {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </Button>
  );

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1);
  const maxDate = new Date(); maxDate.setMonth(maxDate.getMonth() + 1);

  return (
    <section id="booking" className="py-20 md:py-32 bg-card relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">{t.booking.tag}</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-4 mb-4">{t.booking.title}</h2>
          <p className="text-lg text-muted-foreground">{t.booking.desc}</p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-background rounded-3xl p-6 md:p-10 shadow-card border border-border/50">
          <Stepper />

          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{t.booking.pickLocation}</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => { setLocationId(loc.id); setSelectedDate(undefined); setSelectedSlot(null); setStep(2); }}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-start transition-all hover:shadow-md hover:border-primary",
                      locationId === loc.id ? "border-primary bg-primary-soft" : "border-border bg-card",
                    )}
                  >
                    <MapPin className="w-6 h-6 text-primary mb-3" />
                    <div className="font-semibold text-lg">{locName(loc)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{t.booking.pickDate}</h3>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">{t.booking.loadingSlots}</p>
              ) : availableDates.size === 0 ? (
                <div className="text-center py-8 px-4 bg-muted/40 rounded-2xl border border-border">
                  <CalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
                  <p className="text-base text-foreground font-medium mb-4">{t.booking.noAvailability}</p>
                  <Button variant="outline" onClick={() => { setLocationId(null); setStep(1); }}>
                    {t.booking.changeLocation}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { if (d) { setSelectedDate(d); setSelectedSlot(null); setStep(3); } }}
                    fromDate={minDate}
                    toDate={maxDate}
                    disabled={(d) => !availableDates.has(d.toDateString())}
                    className="pointer-events-auto rounded-xl border border-border"
                  />
                </div>
              )}
              <div className="flex justify-between mt-6"><Back to={1} /><div /></div>
            </div>
          )}

          {step === 3 && selectedDate && (
            <div>
              <h3 className="text-lg font-semibold mb-1">{t.booking.pickTime}</h3>
              <p className="text-sm text-muted-foreground mb-4">{selectedDate.toLocaleDateString(lang === "en" ? "en-GB" : lang === "he" ? "he-IL" : "ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              {loading ? (
                <p className="text-muted-foreground">{t.booking.loadingSlots}</p>
              ) : slotsForDay.length === 0 ? (
                <p className="text-muted-foreground">{t.booking.noSlots}</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slotsForDay.map((s) => (
                    <button
                      key={s.iso}
                      onClick={() => { setSelectedSlot(s); setStep(4); }}
                      className={cn(
                        "py-3 rounded-xl border-2 font-medium text-sm transition hover:border-primary hover:bg-primary-soft",
                        selectedSlot?.iso === s.iso ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                      dir="ltr"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex justify-between mt-6"><Back to={2} /><div /></div>
            </div>
          )}

          {step === 4 && selectedSlot && selectedLocation && selectedDate && (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
              <div className="bg-primary-soft rounded-xl p-4 text-sm">
                <div className="font-semibold mb-2">{t.booking.summary}</div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {locName(selectedLocation)}</span>
                  <span className="flex items-center gap-1"><CalIcon className="w-4 h-4" /> {selectedDate.toLocaleDateString()}</span>
                  <span className="flex items-center gap-1" dir="ltr"><Clock className="w-4 h-4" /> {selectedSlot.label}</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.booking.childName} *</Label>
                  <Input value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} placeholder={t.booking.childNamePh} maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label>{t.booking.childAge}</Label>
                  <Input value={form.childAge} onChange={(e) => setForm({ ...form, childAge: e.target.value })} placeholder={t.booking.childAgePh} maxLength={20} />
                </div>
                <div className="space-y-2">
                  <Label>{t.booking.parentName} *</Label>
                  <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder={t.booking.parentNamePh} maxLength={100} required />
                </div>
                <div className="space-y-2">
                  <Label>{t.booking.phone} *</Label>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t.booking.phonePh} maxLength={20} dir="ltr" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>{t.booking.email} *</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t.booking.emailPh} maxLength={255} dir="ltr" required />
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">{t.booking.callbackNote}</p>

              <div className="flex justify-between">
                <Back to={3} />
                <Button type="submit" variant="hero" disabled={submitting} className="gap-2">
                  {submitting ? t.booking.submitting : (<><Send className="w-4 h-4" />{t.booking.submit}</>)}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
