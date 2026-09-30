import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

const LANG_LABEL: Record<string, string> = { ar: "ערבית", he: "עברית", en: "אנגלית" };

const EMAIL_KEY_LABEL: Record<string, string> = {
  appointment_new: "בקשת תור התקבלה",
  appointment_confirmed: "תור אושר",
  appointment_reminder: "תזכורת (לא בשימוש כרגע)",
  staff_new_appointment: "התראה על תור חדש",
  staff_daily_digest: "סיכום בוקר יומי",
};

const WHATSAPP_KEY_LABEL: Record<string, string> = {
  appointment_confirmed: "אישור תור",
  appointment_cancelled: "ביטול תור",
};

interface EmailRow {
  id: string; template_key: string; language: string; audience: string;
  subject: string; body_html: string; is_enabled: boolean;
}
interface WhatsappRow {
  id: string; template_key: string; language: string; body_text: string; is_enabled: boolean;
}

const PLACEHOLDER_HELP: Record<string, string> = {
  appointment_new: "{{parent_name}} {{child_name}} {{date}} {{time}} {{location}}",
  appointment_confirmed: "{{parent_name}} {{child_name}} {{date}} {{time}} {{location}}",
  appointment_reminder: "{{parent_name}} {{child_name}} {{date}} {{time}} {{location}}",
  appointment_cancelled: "{{parent_name}} {{child_name}} {{date}} {{time}} {{location}}",
  staff_new_appointment: "{{child_name}} {{national_id}} {{parent_name}} {{phone}} {{email}} {{date}} {{time}} {{location}}",
  staff_daily_digest: "{{date}} {{count}} {{appointments_table}} (הטבלה עצמה נבנית אוטומטית, אין לערוך אותה)",
};

export const MessageTemplatesManager = () => {
  const { toast } = useToast();
  const [emailRows, setEmailRows] = useState<EmailRow[]>([]);
  const [waRows, setWaRows] = useState<WhatsappRow[]>([]);
  const [editEmail, setEditEmail] = useState<EmailRow | null>(null);
  const [editWa, setEditWa] = useState<WhatsappRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: e }, { data: w }] = await Promise.all([
      supabase.from("email_templates").select("*").order("audience").order("template_key").order("language"),
      supabase.from("whatsapp_templates").select("*").order("template_key").order("language"),
    ]);
    setEmailRows((e ?? []) as EmailRow[]);
    setWaRows((w ?? []) as WhatsappRow[]);
  };
  useEffect(() => { load(); }, []);

  const toggleEmail = async (row: EmailRow) => {
    await supabase.from("email_templates").update({ is_enabled: !row.is_enabled }).eq("id", row.id);
    load();
  };
  const toggleWa = async (row: WhatsappRow) => {
    await supabase.from("whatsapp_templates").update({ is_enabled: !row.is_enabled }).eq("id", row.id);
    load();
  };

  const saveEmail = async () => {
    if (!editEmail) return;
    setSaving(true);
    const { error } = await supabase.from("email_templates")
      .update({ subject: editEmail.subject, body_html: editEmail.body_html })
      .eq("id", editEmail.id);
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "התבנית עודכנה" });
    setEditEmail(null); load();
  };

  const saveWa = async () => {
    if (!editWa) return;
    setSaving(true);
    const { error } = await supabase.from("whatsapp_templates")
      .update({ body_text: editWa.body_text })
      .eq("id", editWa.id);
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "התבנית עודכנה" });
    setEditWa(null); load();
  };

  const patientEmails = emailRows.filter((r) => r.audience === "patient");
  const staffEmails = emailRows.filter((r) => r.audience === "staff");

  return (
    <div className="space-y-4">
      <Tabs defaultValue="patient">
        <TabsList className="flex-wrap">
          <TabsTrigger value="patient">מיילים ללקוחות</TabsTrigger>
          <TabsTrigger value="staff">מיילים לצוות</TabsTrigger>
          <TabsTrigger value="whatsapp">וואטסאפ (בהכנה)</TabsTrigger>
        </TabsList>

        <TabsContent value="patient" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            נשלחים אוטומטית להורה. אין להזכיר מידע רפואי — רק שם התור והשעה.
          </p>
          {["appointment_new", "appointment_confirmed", "appointment_reminder"].map((key) => (
            <div key={key} className="border rounded-lg p-3">
              <div className="font-medium text-sm mb-2">{EMAIL_KEY_LABEL[key]}</div>
              <div className="space-y-1">
                {patientEmails.filter((r) => r.template_key === key).map((row) => (
                  <TemplateRow key={row.id} label={LANG_LABEL[row.language]} enabled={row.is_enabled}
                    onToggle={() => toggleEmail(row)} onEdit={() => setEditEmail(row)} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="staff" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            נשלחים אליכם (info@otsafa.com), בעברית בלבד. יכולים לכלול מידע מלא, כולל ת.ז.
          </p>
          {["staff_new_appointment", "staff_daily_digest"].map((key) => (
            <div key={key} className="border rounded-lg p-3">
              <div className="font-medium text-sm mb-2">{EMAIL_KEY_LABEL[key]}</div>
              <div className="space-y-1">
                {staffEmails.filter((r) => r.template_key === key).map((row) => (
                  <TemplateRow key={row.id} label={LANG_LABEL[row.language]} enabled={row.is_enabled}
                    onToggle={() => toggleEmail(row)} onEdit={() => setEditEmail(row)} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4 space-y-2">
          <p className="text-sm text-muted-foreground">
            הכנת הנוסח בלבד — עדיין לא מחובר לשליחה בפועל. כשיחובר ספק (Meta WhatsApp Business API / Green API),
            ההודעות האלה ישמשו אותו ישירות.
          </p>
          {["appointment_confirmed", "appointment_cancelled"].map((key) => (
            <div key={key} className="border rounded-lg p-3">
              <div className="font-medium text-sm mb-2">{WHATSAPP_KEY_LABEL[key]}</div>
              <div className="space-y-1">
                {waRows.filter((r) => r.template_key === key).map((row) => (
                  <TemplateRow key={row.id} label={LANG_LABEL[row.language]} enabled={row.is_enabled}
                    onToggle={() => toggleWa(row)} onEdit={() => setEditWa(row)} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit email template */}
      <Dialog open={!!editEmail} onOpenChange={(o) => !o && setEditEmail(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          {editEmail && (
            <>
              <DialogHeader>
                <DialogTitle>{EMAIL_KEY_LABEL[editEmail.template_key]} · {LANG_LABEL[editEmail.language]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>נושא המייל</Label>
                  <Input value={editEmail.subject} onChange={(e) => setEditEmail({ ...editEmail, subject: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>תוכן (HTML פשוט מותר, למשל &lt;p&gt; ו-&lt;b&gt;)</Label>
                  <Textarea rows={8} value={editEmail.body_html} onChange={(e) => setEditEmail({ ...editEmail, body_html: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">
                  שדות זמינים: <span dir="ltr">{PLACEHOLDER_HELP[editEmail.template_key]}</span>
                </p>
              </div>
              <DialogFooter>
                <Button onClick={saveEmail} disabled={saving}>{saving ? "שומר…" : "שמור"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit WhatsApp template */}
      <Dialog open={!!editWa} onOpenChange={(o) => !o && setEditWa(null)}>
        <DialogContent dir="rtl" className="max-w-lg">
          {editWa && (
            <>
              <DialogHeader>
                <DialogTitle>{WHATSAPP_KEY_LABEL[editWa.template_key]} · {LANG_LABEL[editWa.language]}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>תוכן ההודעה (טקסט פשוט, בלי HTML)</Label>
                  <Textarea rows={6} value={editWa.body_text} onChange={(e) => setEditWa({ ...editWa, body_text: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">
                  שדות זמינים: <span dir="ltr">{PLACEHOLDER_HELP.appointment_confirmed}</span>
                </p>
              </div>
              <DialogFooter>
                <Button onClick={saveWa} disabled={saving}>{saving ? "שומר…" : "שמור"}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TemplateRow = ({ label, enabled, onToggle, onEdit }: { label: string; enabled: boolean; onToggle: () => void; onEdit: () => void }) => (
  <div className="flex items-center gap-3 py-1">
    <span className="text-sm w-16">{label}</span>
    <Badge variant={enabled ? "default" : "secondary"} className="w-16 justify-center">{enabled ? "פעיל" : "כבוי"}</Badge>
    <Switch checked={enabled} onCheckedChange={onToggle} />
    <Button variant="ghost" size="sm" className="gap-1 mr-auto" onClick={onEdit}>
      <Pencil className="w-3.5 h-3.5" /> עריכה
    </Button>
  </div>
);
