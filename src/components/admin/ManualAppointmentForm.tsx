import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

interface Loc { id: string; name_ar: string; name_he: string; name_en: string }

export const ManualAppointmentForm = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [locs, setLocs] = useState<Loc[]>([]);
  const [form, setForm] = useState({
    location_id: "", slot_at: "", child_name: "", child_age: "", child_national_id: "", parent_name: "",
    phone: "", email: "", language: "ar" as "ar" | "he" | "en", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.from("locations").select("*").order("sort_order").then(({ data }) => {
      if (data) { setLocs(data as Loc[]); if (data[0]) setForm((f) => ({ ...f, location_id: data[0].id })); }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.location_id || !form.slot_at || !form.child_name || !form.parent_name || !form.phone) {
      toast({ title: t.booking.errorTitle, description: t.booking.errorRequired, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert({
      location_id: form.location_id,
      slot_at: new Date(form.slot_at).toISOString(),
      child_name: form.child_name.trim(),
      child_age: form.child_age || null,
      child_national_id: form.child_national_id.trim() || null,
      parent_name: form.parent_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      language: form.language,
      notes: form.notes || null,
      status: "confirmed",
      created_by_admin: true,
    });
    setSubmitting(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: t.admin.whSaved });
    setForm({ ...form, slot_at: "", child_name: "", child_age: "", child_national_id: "", parent_name: "", phone: "", email: "", notes: "" });
  };

  return (
    <form onSubmit={submit} className="max-w-2xl bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-semibold text-lg">{t.admin.manualAdd}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t.admin.colLocation}</Label>
          <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{locs.map((l) => <SelectItem key={l.id} value={l.id}>{l[`name_${lang}` as const]}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t.admin.colDate} / {t.admin.colTime}</Label>
          <Input type="datetime-local" value={form.slot_at} onChange={(e) => setForm({ ...form, slot_at: e.target.value })} dir="ltr" required />
        </div>
        <div className="space-y-2"><Label>{t.booking.childName}</Label><Input value={form.child_name} onChange={(e) => setForm({ ...form, child_name: e.target.value })} maxLength={100} required /></div>
        <div className="space-y-2"><Label>{t.booking.childAge}</Label><Input value={form.child_age} onChange={(e) => setForm({ ...form, child_age: e.target.value })} maxLength={20} /></div>
        <div className="space-y-2"><Label>{t.booking.parentName}</Label><Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} maxLength={100} required /></div>
        <div className="space-y-2"><Label>{t.booking.phone}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} dir="ltr" required /></div>
        <div className="space-y-2"><Label>{t.booking.email}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" maxLength={255} /></div>
        <div className="space-y-2">
          <Label>{t.admin.colLang}</Label>
          <Select value={form.language} onValueChange={(v: "ar" | "he" | "en") => setForm({ ...form, language: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="he">עברית</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" disabled={submitting}>{submitting ? t.booking.submitting : t.booking.submit}</Button>
    </form>
  );
};
