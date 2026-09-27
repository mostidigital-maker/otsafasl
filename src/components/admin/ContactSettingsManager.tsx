import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageCircle, Mail } from "lucide-react";

const fields = [
  { key: "phone_display", label: "טלפון (תצוגה)", icon: Phone, dir: "ltr" as const, placeholder: "050-577-2680" },
  { key: "phone_tel", label: "טלפון (חיוג, בפורמט בינלאומי)", icon: Phone, dir: "ltr" as const, placeholder: "+972505772680" },
  { key: "whatsapp_number", label: "מספר וואטסאפ (בפורמט בינלאומי, בלי +)", icon: MessageCircle, dir: "ltr" as const, placeholder: "972505772680" },
  { key: "contact_email", label: "אימייל", icon: Mail, dir: "ltr" as const, placeholder: "info@ot-clinic.com" },
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
    setSaving(true);
    const rows = fields.map((f) => ({ key: f.key, value: (values[f.key] ?? "").trim(), updated_at: new Date().toISOString() }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "פרטי הקשר עודכנו באתר" });
  };

  return (
    <div className="space-y-4 max-w-lg">
      <p className="text-sm text-muted-foreground">
        הפרטים האלה מוצגים בדף "צור קשר" באתר, בכפתור הוואטסאפ הצף ובתחתית האתר.
      </p>
      {fields.map((f) => (
        <div key={f.key} className="space-y-2">
          <Label className="flex items-center gap-2">
            <f.icon className="w-4 h-4 text-primary" /> {f.label}
          </Label>
          <Input
            dir={f.dir}
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
