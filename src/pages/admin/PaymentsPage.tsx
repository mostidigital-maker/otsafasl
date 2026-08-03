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
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRecord | null>(null);
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  const load = () => {
    supabase.from("payments").select("*, patient:patients(id, full_name)")
      .is("deleted_at", null).order("payment_date", { ascending: false })
      .then(({ data }) => setAllRows((data ?? []) as any));
  };

  useEffect(() => { load(); }, []);

  const rows = allRows.filter((r) => {
    const d = r.payment_date.slice(0, 10);
    return (!from || d >= from) && (!to || d <= to);
  });

  const setRange = (f: Date, t: Date) => {
    setFrom(format(f, "yyyy-MM-dd")); setTo(format(t, "yyyy-MM-dd"));
  };

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
    XLSX.writeFile(wb, `payments-${from || "all"}_${to || "all"}.xlsx`);
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

      <Card className="p-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">מתאריך</Label>
          <Input type="date" dir="ltr" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">עד תאריך</Label>
          <Input type="date" dir="ltr" className="w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setRange(startOfMonth(today), endOfMonth(today))}>החודש</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const p = subMonths(today, 1); setRange(startOfMonth(p), endOfMonth(p));
          }}>חודש קודם</Button>
          <Button variant="outline" size="sm" onClick={() => setRange(new Date(today.getFullYear(), 0, 1), new Date(today.getFullYear(), 11, 31))}>השנה</Button>
          <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>הצג הכל</Button>
        </div>
        <p className="text-xs text-muted-foreground">{rows.length} תשלומים בטווח</p>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">סה"כ חיובים</p><p className="text-xl font-bold">₪{totals.price}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">שולם</p><p className="text-xl font-bold text-primary">₪{totals.paid}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">יתרה</p><p className="text-xl font-bold text-destructive">₪{totals.price - totals.paid}</p></Card>
      </div>

      <PaymentFormDialog open={open} onOpenChange={setOpen} patientId={editing?.patient_id ?? null} payment={editing} onSaved={load} />

      {rows.length === 0 && <p className="text-muted-foreground">אין תשלומים בטווח שנבחר.</p>}

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
