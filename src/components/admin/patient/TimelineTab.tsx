import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, ClipboardList, Wallet, StickyNote } from "lucide-react";
import { format } from "date-fns";

interface Event { at: string; kind: "appointment" | "treatment" | "payment" | "note"; title: string; desc?: string; }

const iconFor = (k: Event["kind"]) => {
  if (k === "appointment") return Calendar;
  if (k === "treatment") return ClipboardList;
  if (k === "payment") return Wallet;
  return StickyNote;
};

const statusHe: Record<string, string> = {
  pending: "ממתין", confirmed: "מאושר", cancelled: "בוטל",
  arrived: "הגיע", completed: "הושלם", no_show: "לא הגיע",
};

export const TimelineTab = ({ patientId }: { patientId: string }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [apps, trs, pays, nots] = await Promise.all([
        supabase.from("appointments").select("id, slot_at, status, notes").eq("patient_id", patientId).is("deleted_at", null),
        supabase.from("treatments").select("id, treatment_date, summary").eq("patient_id", patientId).is("deleted_at", null),
        supabase.from("payments").select("id, payment_date, treatment_price, patient_paid, insurance_paid, payment_type").eq("patient_id", patientId).is("deleted_at", null),
        supabase.from("internal_notes").select("id, created_at, content").eq("patient_id", patientId).is("deleted_at", null),
      ]);
      const ev: Event[] = [];
      (apps.data ?? []).forEach((a: any) => ev.push({
        at: a.slot_at, kind: "appointment",
        title: `תור — ${statusHe[a.status] || a.status}`,
        desc: a.notes || undefined,
      }));
      (trs.data ?? []).forEach((t: any) => ev.push({
        at: t.treatment_date, kind: "treatment",
        title: "תיעוד טיפול",
        desc: t.summary || undefined,
      }));
      (pays.data ?? []).forEach((p: any) => ev.push({
        at: p.payment_date, kind: "payment",
        title: `תשלום — ₪${p.treatment_price}`,
        desc: `שולם: ₪${p.patient_paid} · ביטוח: ₪${p.insurance_paid}`,
      }));
      (nots.data ?? []).forEach((n: any) => ev.push({
        at: n.created_at, kind: "note", title: "הערה פנימית", desc: n.content,
      }));
      ev.sort((a, b) => (a.at < b.at ? 1 : -1));
      setEvents(ev); setLoading(false);
    })();
  }, [patientId]);

  if (loading) return <p className="text-muted-foreground p-4">טוען…</p>;
  if (events.length === 0) return <p className="text-muted-foreground p-4">אין פעילות עדיין.</p>;

  return (
    <div className="space-y-3">
      {events.map((e, i) => {
        const Icon = iconFor(e.kind);
        return (
          <Card key={i} className="shadow-soft">
            <CardContent className="flex gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 grid place-items-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {format(new Date(e.at), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                {e.desc && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.desc}</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
