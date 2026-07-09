import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

interface Row {
  id: string; payment_date: string; insurance_paid: number; treatment_price: number;
  insurance_provider: string | null; needs_insurance_submission: boolean;
  patient: { id: string; full_name: string; national_id: string | null } | null;
}

const InsurancePage = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from("payments").select("*, patient:patients(id, full_name, national_id)")
      .is("deleted_at", null)
      .in("payment_type", ["insurance", "mixed"])
      .order("payment_date", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as any));
  }, []);

  const pending = rows.filter((r) => r.needs_insurance_submission);
  const totalPending = pending.reduce((s, r) => s + Number(r.treatment_price) - Number(r.insurance_paid), 0);

  const exportExcel = () => {
    const data = pending.map((r) => ({
      תאריך: r.payment_date, מטופל: r.patient?.full_name || "", "ת.ז": r.patient?.national_id || "",
      "יתרה להגשה": Number(r.treatment_price) - Number(r.insurance_paid),
      "ספק": r.insurance_provider || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ביטוח");
    XLSX.writeFile(wb, `insurance-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">ביטוח</h1>
          <p className="text-muted-foreground text-sm">הגשות ממתינות והחזרים</p>
        </div>
        <Button onClick={exportExcel} className="gap-2"><Download className="w-4 h-4" /> ייצוא Excel</Button>
      </div>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground">סה"כ ממתין להגשה</p>
        <p className="text-2xl font-bold">₪{totalPending}</p>
      </Card>

      {rows.length === 0 && <p className="text-muted-foreground">אין תשלומי ביטוח.</p>}
      {rows.map((r) => (
        <Card key={r.id} className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[180px]">
            {r.patient ? (
              <Link to={`/admin/patients/${r.patient.id}`} className="font-medium text-primary hover:underline">
                {r.patient.full_name}
              </Link>
            ) : "—"}
            <p className="text-xs text-muted-foreground" dir="ltr">
              {r.patient?.national_id} · {format(new Date(r.payment_date), "dd/MM/yyyy")}
            </p>
          </div>
          <div className="text-sm">מחיר: ₪{r.treatment_price}</div>
          <div className="text-sm">שולם ביטוח: ₪{r.insurance_paid}</div>
          <Badge variant={r.needs_insurance_submission ? "destructive" : "default"}>
            {r.needs_insurance_submission ? "טרם הוגש" : "הוגש"}
          </Badge>
        </Card>
      ))}
    </div>
  );
};

export default InsurancePage;
