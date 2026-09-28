import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageCircle, Mail, Award } from "lucide-react";

const fields = [
  { key: "phone_display", label: "טלפון (תצוגה)", icon: Phone, dir: "ltr" as const, placeholder: "050-577-2680", type: "text" },
  { key: "phone_tel", label: "טלפון (חיוג, בפורמט בינלאומי)", icon: Phone, dir: "ltr" as const, placeholder: "+972505772680", type: "text" },
  { key: "whatsapp_number", label: "מספר וואטסאפ (בפורמט בינלאומי, בלי +)", icon: MessageCircle, dir: "ltr" as const, placeholder: "972505772680", type: "text" },
  { key: "contact_email", label: "אימייל", icon: Mail, dir: "ltr" as const, placeholder: "info@ot-clinic.com", type: "email" },
  { key: "experience_years", label: "שנות ניסיון", icon: Award, dir: "rtl" as const, placeholder: "10", type: "number" },
];

export const ContactSettingsManager = () => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    const map: Record<string, string> = {};
    for (const row of (data ?? []) as { key: string; value: string }[]) map[row.key] = row.value;
    setValues(map);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const experienceYears = Number(values.experience_years);
    if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 99) {
      toast({ title: "שגיאה", description: "יש להזין מספר שלם בין 0 ל־99", variant: "destructive" });
      return;
    }
    setSaving(true);
    const rows = fields.map((f) => ({ key: f.key, value: (values[f.key] ?? "").trim(), updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "פרטי האתר עודכנו" });
  };

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground">
        הפרטים האלה מוצגים בכל האזורים המתאימים באתר.
      </p>
      {fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label className="flex items-center gap-2">
            <f.icon className="w-4 h-4 text-primary" /> {f.label}
          </Label>
          <Input
            dir={f.dir}
            type={f.type}
            min={f.type === "number" ? 0 : undefined}
            max={f.type === "number" ? 99 : undefined}
            placeholder={f.placeholder}
            value={values[f.key] ?? ""}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          />
        </div>
      ))}
      <Button onClick={save} disabled={saving}>{saving ? "שומר…" : "שמור שינויים"}</Button>
    </div>
  );
};
