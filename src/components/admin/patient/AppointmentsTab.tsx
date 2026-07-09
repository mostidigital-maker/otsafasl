import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Row { id: string; slot_at: string; status: string; notes: string | null; duration_minutes: number; }

const STATUSES = [
  { v: "pending", l: "ממתין" }, { v: "confirmed", l: "מאושר" },
  { v: "arrived", l: "הגיע" }, { v: "completed", l: "הושלם" },
  { v: "no_show", l: "לא הגיע" }, { v: "cancelled", l: "בוטל" },
];

const badgeVariant = (s: string) => {
  if (s === "completed") return "default";
  if (s === "cancelled" || s === "no_show") return "destructive";
  return "secondary";
};

export const AppointmentsTab = ({ patientId }: { patientId: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("id, slot_at, status, notes, duration_minutes")
      .eq("patient_id", patientId).is("deleted_at", null)
      .order("slot_at", { ascending: false });
    setRows((data ?? []) as Row[]);
  };

  useEffect(() => { load(); }, [patientId]);

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "arrived") patch.arrived_at = new Date().toISOString();
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("appointments").update(patch).eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "עודכן" });
    load();
  };

  if (rows.length === 0) return <p className="text-muted-foreground p-4">אין תורים למטופל זה.</p>;

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <p className="font-medium" dir="ltr">{format(new Date(r.slot_at), "dd/MM/yyyy HH:mm")}</p>
            <p className="text-xs text-muted-foreground">{r.duration_minutes} דק'</p>
            {r.notes && <p className="text-sm mt-1">{r.notes}</p>}
          </div>
          <Badge variant={badgeVariant(r.status) as any}>
            {STATUSES.find((s) => s.v === r.status)?.l || r.status}
          </Badge>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.filter((s) => s.v !== r.status).map((s) => (
              <Button key={s.v} size="sm" variant="outline" onClick={() => setStatus(r.id, s.v)}>{s.l}</Button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};
