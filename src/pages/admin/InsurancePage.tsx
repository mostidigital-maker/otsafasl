import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Download, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { balanceOf, settlePayment, PaymentRecord } from "@/components/admin/PaymentFormDialog";

interface Row extends PaymentRecord {
  patient: { id: string; full_name: string; national_id: string | null } | null;
}

const InsurancePage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  const load = () => {
    supabase.from("payments").select("*, patient:patients(id, full_name, national_id)")
      .is("deleted_at", null)
      .in("payment_type", ["insurance", "mixed"])
      .order("payment_date", { ascending: false })
      .then(({ data }) => { setRows((data ?? []) as any); setSelected({}); });
  };

  useEffect(() => { load(); }, []);

  const [showAll, setShowAll] = useState(false);
  const inMonth = (d: string) => d.slice(0, 7) === month;
  const monthRows = rows.filter((r) => inMonth(r.payment_date));
  const visibleRows = showAll ? rows : monthRows;
  const pending = rows.filter((r) => r.needs_insurance_submission);
  const remainingOf = (r: Row) => balanceOf(r);
  const totalPending = pending.reduce((s, r) => s + remainingOf(r), 0);
  const monthPending = monthRows.filter((r) => r.needs_insurance_submission);
  const monthPendingTotal = monthPending.reduce((s, r) => s + remainingOf(r), 0);
  const monthTotal = monthRows.reduce((s, r) => s + Number(r.treatment_price), 0);

  const selectedIds = Object.keys(selected).filter((k) => selected[k]);


  const settle = async (targets: Row[]) => {
    if (targets.length === 0) return;
    setBusy(true);
    for (const r of targets) {
      await settlePayment(r);
    }
    setBusy(false);
    toast({ title: `סומנו ${targets.length} תשלומים כשולמו ע"י הביטוח` });
    load();
  };

  const exportExcel = (onlyPending: boolean) => {
    const src = onlyPending ? monthPending : monthRows;
    const data = src.map((r) => ({
      תאריך: r.payment_date, מטופל: r.patient?.full_name || "", "ת.ז": r.patient?.national_id || "",
      מחיר: Number(r.treatment_price),
      "שולם ביטוח": Number(r.insurance_paid),
      "יתרה להגשה": remainingOf(r),
      "ספק": r.insurance_provider || "",
      סטטוס: r.needs_insurance_submission ? "טרם שולם" : "שולם",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ביטוח");
    XLSX.writeFile(wb, `insurance-${month}${onlyPending ? "-pending" : ""}.xlsx`);
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">ביטוח</h1>
          <p className="text-muted-foreground text-sm">הגשות ממתינות והחזרים — כולל חודשים קודמים</p>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)}><ChevronRight className="w-4 h-4" /></Button>
          <Input type="month" dir="ltr" className="w-40" value={month} onChange={(e) => setMonth(e.target.value)} />
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button onClick={() => exportExcel(false)} className="gap-2"><Download className="w-4 h-4" /> ייצוא כל החודש</Button>
          <Button variant="outline" onClick={() => exportExcel(true)} className="gap-2"><Download className="w-4 h-4" /> ממתינים בלבד</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">סה"כ ממתין להגשה (הכל)</p>
          <p className="text-2xl font-bold text-destructive">₪{totalPending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">ממתין בחודש {month}</p>
          <p className="text-2xl font-bold text-destructive">₪{monthPendingTotal}</p>
          <p className="text-xs text-muted-foreground">{monthPending.length} מתוך {monthRows.length} · סה"כ חיובים ₪{monthTotal}</p>
        </Card>
        <Card className="p-4 flex flex-col justify-between gap-2">
          <p className="text-xs text-muted-foreground">סגירת חודש — כללית שילמה</p>
          <Button disabled={busy || monthPending.length === 0} className="gap-2" onClick={() => settle(monthPending)}>
            <Check className="w-4 h-4" /> סמן את כל החודש כשולם
          </Button>
          <Button variant="outline" size="sm" disabled={busy || selectedIds.length === 0}
            onClick={() => settle(rows.filter((r) => selected[r.id]))}>
            סמן נבחרים ({selectedIds.length})
          </Button>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Button variant={showAll ? "outline" : "default"} size="sm" onClick={() => setShowAll(false)}>חודש {month}</Button>
        <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll(true)}>כל התשלומים ({rows.length})</Button>
      </div>

      {visibleRows.length === 0 && <p className="text-muted-foreground">אין תשלומי ביטוח בטווח שנבחר.</p>}
      {visibleRows.map((r) => {

        const remaining = remainingOf(r);
        const isPending = r.needs_insurance_submission;
        return (
          <Card key={r.id} className={`p-4 flex flex-wrap items-center gap-3 ${isPending ? "border-destructive/50 bg-destructive/5" : ""}`}>
            {isPending && (
              <Checkbox checked={!!selected[r.id]}
                onCheckedChange={(v) => setSelected({ ...selected, [r.id]: !!v })} />
            )}
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
            {isPending && <div className="text-sm text-destructive font-medium">להחזר: ₪{remaining}</div>}
            <Badge variant={isPending ? "destructive" : "default"}>
              {isPending ? "טרם שולם" : "שולם ✓"}
            </Badge>
            {isPending && (
              <Button size="sm" variant="outline" className="gap-1" disabled={busy} onClick={() => settle([r])}>
                <Check className="w-4 h-4" /> שולם
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default InsurancePage;
