import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Row {
  id: string; suggested_date: string; priority: string; status: string; notes: string | null;
  patient: { id: string; full_name: string; phone: string | null } | null;
}

const RemindersPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = async () => {
    let q = supabase.from("follow_up_reminders")
      .select("id, suggested_date, priority, status, notes, patient:patients(id, full_name, phone)")
      .is("deleted_at", null)
      .order("suggested_date", { ascending: true });
    if (filter === "pending") q = q.eq("status", "pending");
    const { data } = await q;
    setRows((data ?? []) as any);
  };
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id: string, status: string) => {
    const patch: any = { status };
    if (status === "completed") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("follow_up_reminders").update(patch).eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    load();
  };

  const priorityBadge = (p: string) =>
    p === "high" ? "destructive" : p === "low" ? "secondary" : "default";
  const priorityLabel = (p: string) => p === "high" ? "גבוהה" : p === "low" ? "נמוכה" : "בינונית";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">תזכורות מעקב</h1>
          <p className="text-muted-foreground text-sm">מטופלים שדורשים תור נוסף</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>ממתינות</Button>
          <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>הכל</Button>
        </div>
      </div>

      {rows.length === 0 && <p className="text-muted-foreground">אין תזכורות.</p>}
      {rows.map((r) => (
        <Card key={r.id} className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            {r.patient ? (
              <Link to={`/admin/patients/${r.patient.id}`} className="font-medium text-primary hover:underline">
                {r.patient.full_name}
              </Link>
            ) : <span className="text-muted-foreground">—</span>}
            {r.patient?.phone && <p className="text-xs text-muted-foreground" dir="ltr">{r.patient.phone}</p>}
            {r.notes && <p className="text-sm mt-1">{r.notes}</p>}
          </div>
          <div className="text-sm" dir="ltr">{format(new Date(r.suggested_date), "dd/MM/yyyy")}</div>
          <Badge variant={priorityBadge(r.priority) as any}>{priorityLabel(r.priority)}</Badge>
          <Badge variant="outline">{r.status === "pending" ? "ממתין" : r.status === "completed" ? "הושלם" : r.status === "scheduled" ? "נקבע" : "נדחה"}</Badge>
          {r.status === "pending" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setStatus(r.id, "completed")}>הושלם</Button>
              <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "dismissed")}>דחה</Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default RemindersPage;
