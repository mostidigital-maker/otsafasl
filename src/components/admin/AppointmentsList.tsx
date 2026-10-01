import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Trash2, MessageCircle } from "lucide-react";

interface Appointment {
  id: string;
  location_id: string;
  slot_at: string;
  child_name: string;
  child_age: string | null;
  child_national_id: string | null;
  parent_name: string;
  phone: string;
  email: string | null;
  language: "ar" | "he" | "en";
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
  created_by_admin: boolean;
}
interface Loc { id: string; name_ar: string; name_he: string; name_en: string }

const toWaPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits.startsWith("972") ? digits : "972" + digits;
};

const fillTemplate = (text: string, data: Record<string, string>) =>
  text.replace(/{{\s*(\w+)\s*}}/g, (_, key) => data[key] ?? "");

// Free, manual flow: looks up the admin-edited template, opens a pre-filled
// wa.me compose window (staff still has to press send in WhatsApp), and
// logs that it was opened. No API/provider connected — zero cost.
const openWhatsAppFromTemplate = async (
  kind: "confirmed" | "cancelled",
  appt: Appointment,
  locName: string
) => {
  const templateKey = kind === "confirmed" ? "appointment_confirmed" : "appointment_cancelled";
  const { data: tmpl } = await supabase
    .from("whatsapp_templates")
    .select("body_text, is_enabled")
    .eq("template_key", templateKey)
    .eq("language", appt.language)
    .maybeSingle();
  if (!tmpl || !tmpl.is_enabled) return;

  const d = new Date(appt.slot_at);
  const dateStr = d.toLocaleDateString(
    appt.language === "en" ? "en-GB" : appt.language === "he" ? "he-IL" : "ar-EG",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  );
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const message = fillTemplate(tmpl.body_text, {
    parent_name: appt.parent_name, child_name: appt.child_name, date: dateStr, time: timeStr, location: locName,
  });
  const phone = toWaPhone(appt.phone);

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");

  supabase.from("message_log").insert({
    appointment_id: appt.id, channel: "whatsapp", template_key: templateKey,
    to_phone: phone, body_text: message, status: "opened",
  }).then(() => {});
};

export const AppointmentsList = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [locs, setLocs] = useState<Record<string, Loc>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "cancelled">("pending");

  const load = async () => {
    const [a, l] = await Promise.all([
      supabase.from("appointments").select("*").is("deleted_at", null).order("slot_at", { ascending: true }),
      supabase.from("locations").select("*"),
    ]);
    if (a.data) setRows(a.data as Appointment[]);
    if (l.data) setLocs(Object.fromEntries(l.data.map((x: Loc) => [x.id, x])));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    const appt = rows.find((r) => r.id === id);
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: status === "confirmed" ? t.admin.confirmed : t.admin.cancelled });
    if (status === "confirmed" || status === "cancelled") {
      supabase.functions.invoke("notify-appointment", { body: { appointment_id: id, kind: status } }).catch(() => {});
      // Automated WhatsApp via Green API is built and ready, but intentionally not called yet —
      // staying on the free manual flow below until GREEN_API_* secrets are connected.
    }
    if (appt && (status === "confirmed" || status === "cancelled")) {
      const loc = locs[appt.location_id];
      const locNameStr = loc ? (loc[`name_${appt.language}` as const] || loc.name_ar) : "";
      openWhatsAppFromTemplate(status, appt, locNameStr);
    }
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את התור לצמיתות?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "התור נמחק" });
    load();
  };

  const filtered = rows.filter((r) => filter === "all" ? true : r.status === filter);
  const locName = (id: string) => {
    const l = locs[id];
    return l ? l[`name_${lang}` as const] : "";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={filter} onValueChange={(v: typeof filter) => setFilter(v)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.admin.filterAll}</SelectItem>
            <SelectItem value="pending">{t.admin.filterPending}</SelectItem>
            <SelectItem value="confirmed">{t.admin.filterConfirmed}</SelectItem>
            <SelectItem value="cancelled">{t.admin.filterCancelled}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.colDate}</TableHead>
              <TableHead>{t.admin.colTime}</TableHead>
              <TableHead>{t.admin.colLocation}</TableHead>
              <TableHead>{t.admin.colChild}</TableHead>
              <TableHead>{t.admin.colNationalId}</TableHead>
              <TableHead>{t.admin.colParent}</TableHead>
              <TableHead>{t.admin.colPhone}</TableHead>
              <TableHead>{t.admin.colEmail}</TableHead>
              <TableHead>{t.admin.colLang}</TableHead>
              <TableHead>{t.admin.colStatus}</TableHead>
              <TableHead>{t.admin.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-8">{t.admin.noAppointments}</TableCell></TableRow>
            )}
            {filtered.map((r) => {
              const d = new Date(r.slot_at);
              return (
                <TableRow key={r.id}>
                  <TableCell>{d.toLocaleDateString()}</TableCell>
                  <TableCell dir="ltr">{d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</TableCell>
                  <TableCell>{locName(r.location_id)}</TableCell>
                  <TableCell>{r.child_name}{r.child_age ? ` (${r.child_age})` : ""}</TableCell>
                  <TableCell dir="ltr" className="text-xs">{r.child_national_id || "—"}</TableCell>
                  <TableCell>{r.parent_name}</TableCell>
                  <TableCell dir="ltr">{r.phone}</TableCell>
                  <TableCell dir="ltr" className="text-xs">{r.email || "—"}</TableCell>
                  <TableCell className="uppercase text-xs">{r.language}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}>
                      {r.status === "pending" ? t.admin.filterPending : r.status === "confirmed" ? t.admin.filterConfirmed : t.admin.filterCancelled}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {r.status !== "confirmed" && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(r.id, "confirmed")} title={t.admin.confirm}><Check className="w-4 h-4 text-accent" /></Button>
                      )}
                      {r.status !== "cancelled" && (
                        <Button size="icon" variant="ghost" onClick={() => updateStatus(r.id, "cancelled")} title={t.admin.cancel}><X className="w-4 h-4" /></Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)} title={t.admin.delete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      {r.status === "confirmed" && (() => {
                        const loc = locs[r.location_id];
                        const locNameStr = loc ? (loc[`name_${r.language}` as const] || loc.name_ar) : "";
                        return (
                          <Button size="icon" variant="ghost" onClick={() => openWhatsAppFromTemplate("confirmed", r, locNameStr)} title={t.booking.sendWhatsapp}>
                            <MessageCircle className="w-4 h-4 text-[#25D366]" />
                          </Button>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
