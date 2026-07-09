import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

interface Row {
  id: string; payment_date: string; treatment_price: number; patient_paid: number;
  insurance_paid: number; payment_type: string; insurance_provider: string | null;
  needs_insurance_submission: boolean;
  patient: { id: string; full_name: string } | null;
}

const PaymentsPage = () => {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from("payments").select("*, patient:patients(id, full_name)")
      .is("deleted_at", null).order("payment_date", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as any));
  }, []);

  const totals = rows.reduce((a, r) => ({
    price: a.price + Number(r.treatment_price),
    paid: a.paid + Number(r.patient_paid) + Number(r.insurance_paid),
  }), { price: 0, paid: 0 });

  const exportExcel = () => {
    const data = rows.map((r) => ({
      תאריך: r.payment_date,
      מטופל: r.patient?.full_name || "",
      מחיר: r.treatment_price,
      "שולם מטופל": r.patient_paid,
      "שולם ביטוח": r.insurance_paid,
      סוג: r.payment_type,
      ביטוח: r.insurance_provider || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "תשלומים");
    XLSX.writeFile(wb, `payments-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">תשלומים</h1>
          <p className="text-muted-foreground text-sm">כלל התשלומים בקליניקה</p>
        </div>
        <Button onClick={exportExcel} className="gap-2"><Download className="w-4 h-4" /> ייצוא Excel</Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">סה"כ חיובים</p><p className="text-xl font-bold">₪{totals.price}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">שולם</p><p className="text-xl font-bold text-primary">₪{totals.paid}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">יתרה</p><p className="text-xl font-bold text-destructive">₪{totals.price - totals.paid}</p></Card>
      </div>

      {rows.length === 0 && <p className="text-muted-foreground">אין תשלומים.</p>}
      {rows.map((r) => {
        const bal = Number(r.treatment_price) - Number(r.patient_paid) - Number(r.insurance_paid);
        return (
          <Card key={r.id} className="p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px]">
              {r.patient ? (
                <Link to={`/admin/patients/${r.patient.id}`} className="font-medium text-primary hover:underline">
                  {r.patient.full_name}
                </Link>
              ) : "—"}
              <p className="text-xs text-muted-foreground" dir="ltr">{format(new Date(r.payment_date), "dd/MM/yyyy")}</p>
            </div>
            <div className="text-sm">₪{r.treatment_price}</div>
            <Badge variant={bal > 0 ? "destructive" : "default"}>יתרה ₪{bal}</Badge>
          </Card>
        );
      })}
    </div>
  );
};

export default PaymentsPage;
