import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { format } from "date-fns";
import { PaymentFormDialog, PaymentRecord, balanceOf, effectivePaid, settlePayment } from "@/components/admin/PaymentFormDialog";

export const PaymentsTab = ({ patientId }: { patientId: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<PaymentRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentRecord | null>(null);

  const load = async () => {
    const { data } = await supabase.from("payments").select("*")
      .eq("patient_id", patientId).is("deleted_at", null)
      .order("payment_date", { ascending: false });
    setRows((data ?? []) as PaymentRecord[]);
  };

  useEffect(() => { load(); }, [patientId]);

  const remove = async (id: string) => {
    if (!confirm("למחוק את התשלום?")) return;
    const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "התשלום נמחק" }); load();
  };

  const settle = async (r: PaymentRecord) => {
    const { error } = await settlePayment(r);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "סומן כשולם ע\"י הביטוח" }); load();
  };

  const total = rows.reduce((s, r) => s + Number(r.treatment_price), 0);
  const paid = rows.reduce((s, r) => s + effectivePaid(r), 0);
  const balance = total - paid;
  const pendingInsurance = rows.filter((r) => r.needs_insurance_submission).reduce((s, r) => s + balanceOf(r), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">סה"כ חיובים</p><p className="text-xl font-bold">₪{total}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">שולם</p><p className="text-xl font-bold text-primary">₪{paid}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">יתרה</p><p className={`text-xl font-bold ${balance > 0 ? "text-destructive" : ""}`}>₪{balance}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">ממתין מהביטוח</p><p className={`text-xl font-bold ${pendingInsurance > 0 ? "text-destructive" : ""}`}>₪{pendingInsurance}</p></Card>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="w-4 h-4" /> תשלום חדש</Button>
      </div>

      <PaymentFormDialog open={open} onOpenChange={setOpen} patientId={patientId} payment={editing} onSaved={load} />

      {rows.length === 0 && <p className="text-muted-foreground p-4">אין תשלומים.</p>}
      {rows.map((r) => {
        const bal = balanceOf(r);
        const pending = r.needs_insurance_submission;
        return (
          <Card key={r.id} className={`p-4 flex flex-wrap items-center gap-4 ${pending ? "border-destructive/50 bg-destructive/5" : ""}`}>
            <div className="flex-1 min-w-[180px]">
              <p className="font-medium" dir="ltr">{format(new Date(r.payment_date), "dd/MM/yyyy")}</p>
              <p className="text-xs text-muted-foreground">
                {r.payment_type === "private" ? "פרטי" : r.payment_type === "insurance" ? "ביטוח" : "משולב"}
                {r.insurance_provider === "clalit_mushlam" && " · כללית משלים"}
              </p>
            </div>
            <div className="text-sm">מחיר: <b>₪{r.treatment_price}</b></div>
            <div className="text-sm">שולם: <b>₪{effectivePaid(r)}</b></div>
            <Badge variant={bal > 0 ? "destructive" : "default"}>יתרה ₪{bal}</Badge>
            {pending && <Badge variant="destructive">ממתין מהביטוח</Badge>}
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
