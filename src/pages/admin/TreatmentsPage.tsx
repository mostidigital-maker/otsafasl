import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Row {
  id: string;
  treatment_date: string;
  summary: string | null;
  progress: string | null;
  patient: { id: string; full_name: string; phone: string | null } | null;
}

const TreatmentsPage = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      let query = supabase.from("treatments")
        .select("id, treatment_date, summary, progress, patient:patients(id, full_name, phone)")
        .is("deleted_at", null)
        .order("treatment_date", { ascending: false })
        .limit(200);
      if (from) query = query.gte("treatment_date", from);
      if (to) query = query.lte("treatment_date", to);
      const { data } = await query;
      setRows((data ?? []) as any);
    })();
  }, [from, to]);

  const filtered = q
    ? rows.filter(r => r.patient?.full_name.toLowerCase().includes(q.toLowerCase()))
    : rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">טיפולים</h1>
        <p className="text-muted-foreground text-sm">רשימת כל הטיפולים המתועדים</p>
      </div>

      <Card className="p-4 grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs text-muted-foreground">חיפוש מטופל</label>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="שם המטופל…" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">מתאריך</label>
          <Input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">עד תאריך</label>
          <Input type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </Card>

      {filtered.length === 0 && <p className="text-muted-foreground">לא נמצאו טיפולים.</p>}
      {filtered.map(r => (
        <Card key={r.id} className="p-4">
          <div className="flex justify-between items-start gap-3 flex-wrap">
            <div>
              {r.patient ? (
                <Link to={`/admin/patients/${r.patient.id}`} className="font-medium text-primary hover:underline">
                  {r.patient.full_name}
                </Link>
              ) : <span className="text-muted-foreground">—</span>}
              {r.patient?.phone && <p className="text-xs text-muted-foreground" dir="ltr">{r.patient.phone}</p>}
            </div>
            <div className="text-sm text-muted-foreground" dir="ltr">
              {format(new Date(r.treatment_date), "dd/MM/yyyy")}
            </div>
          </div>
          {r.summary && <p className="text-sm mt-2"><span className="font-medium">סיכום: </span>{r.summary}</p>}
          {r.progress && <p className="text-sm mt-1"><span className="font-medium">התקדמות: </span>{r.progress}</p>}
        </Card>
      ))}
    </div>
  );
};

export default TreatmentsPage;
