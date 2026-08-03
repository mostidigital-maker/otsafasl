import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import * as XLSX from "xlsx";
import { Download, Pencil, Trash2, Check } from "lucide-react";
import { PaymentFormDialog, PaymentRecord, balanceOf, effectivePaid, settlePayment } from "@/components/admin/PaymentFormDialog";

interface Row extends PaymentRecord {
  patient: { id: string; full_name: string } | null;
}


const PaymentsPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRecord | null>(null);

  const load = () => {
    supabase.from("payments").select("*, patient:patients(id, full_name)")
      .is("deleted_at", null).order("payment_date", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as any));
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("למחוק את התשלום?")) return;
    const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "התשלום נמחק" }); load();
  };

  const settle = async (r: Row) => {
    const { error } = await settlePayment(r);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "סומן כשולם ע\"י הביטוח" }); load();
  };

  const totals = rows.reduce((a, r) => ({
    price: a.price + Number(r.treatment_price),
    paid: a.paid + effectivePaid(r),
  }), { price: 0, paid: 0 });

  const exportExcel = () => {
    const data = rows.map((r) => ({
      תאריך: r.payment_date,
      מטופל: r.patient?.full_name || "",
      מחיר: r.treatment_price,
      "שולם מטופל": r.patient_paid,
      "שולם ביטוח": r.insurance_paid,
      "יתרה": balanceOf(r),
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

      <PaymentFormDialog open={open} onOpenChange={setOpen} patientId={editing?.patient_id ?? null} payment={editing} onSaved={load} />

      {rows.length === 0 && <p className="text-muted-foreground">אין תשלומים.</p>}
      {rows.map((r) => {
        const bal = balanceOf(r);
        const pending = r.needs_insurance_submission;
        return (
          <Card key={r.id} className={`p-4 flex flex-wrap items-center gap-3 ${pending ? "border-destructive/50 bg-destructive/5" : ""}`}>
            <div className="flex-1 min-w-[180px]">
              {r.patient ? (
                <Link to={`/admin/patients/${r.patient.id}`} className="font-medium text-primary hover:underline">
                  {r.patient.full_name}
                </Link>
              ) : "—"}
              <p className="text-xs text-muted-foreground" dir="ltr">{format(new Date(r.payment_date), "dd/MM/yyyy")}</p>
            </div>
            <div className="text-sm">מחיר: ₪{r.treatment_price}</div>
            <div className="text-sm">שולם: ₪{effectivePaid(r)}</div>
            {pending && <Badge variant="destructive">ממתין מהביטוח</Badge>}
            <Badge variant={bal > 0 ? "destructive" : "default"}>יתרה ₪{bal}</Badge>
            <div className="flex gap-1">
              {pending && (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => settle(r)}>
                  <Check className="w-4 h-4" /> שולם ע"י הביטוח
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default PaymentsPage;
