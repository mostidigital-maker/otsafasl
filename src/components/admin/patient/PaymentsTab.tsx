import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { format } from "date-fns";

interface Payment {
  id: string; payment_date: string; treatment_price: number; patient_paid: number;
  insurance_paid: number; payment_type: string; insurance_provider: string | null;
  needs_insurance_submission: boolean; notes: string | null;
}

const empty = {
  payment_date: new Date().toISOString().slice(0, 10),
  treatment_price: "", patient_paid: "0", insurance_paid: "0",
  payment_type: "private" as "private" | "insurance" | "mixed",
  insurance_provider: "none" as "none" | "clalit_mushlam" | "other",
  needs_insurance_submission: false, notes: "",
};

export const PaymentsTab = ({ patientId }: { patientId: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Payment[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("payments").select("*")
      .eq("patient_id", patientId).is("deleted_at", null)
      .order("payment_date", { ascending: false });
    setRows((data ?? []) as Payment[]);
  };

  useEffect(() => { load(); }, [patientId]);

  const openNew = () => { setEditingId(null); setForm(empty); setOpen(true); };
  const openEdit = (r: Payment) => {
    setEditingId(r.id);
    setForm({
      payment_date: r.payment_date.slice(0, 10),
      treatment_price: String(r.treatment_price),
      patient_paid: String(r.patient_paid),
      insurance_paid: String(r.insurance_paid),
      payment_type: r.payment_type as any,
      insurance_provider: (r.insurance_provider ?? "none") as any,
      needs_insurance_submission: r.needs_insurance_submission,
      notes: r.notes ?? "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      patient_id: patientId,
      payment_date: form.payment_date,
      treatment_price: Number(form.treatment_price) || 0,
      patient_paid: Number(form.patient_paid) || 0,
      insurance_paid: Number(form.insurance_paid) || 0,
      payment_type: form.payment_type,
      insurance_provider: form.insurance_provider === "none" ? null : form.insurance_provider,
      needs_insurance_submission: form.needs_insurance_submission,
      notes: form.notes || null,
    } as any;
    const { error } = editingId
      ? await supabase.from("payments").update(payload).eq("id", editingId)
      : await supabase.from("payments").insert(payload);
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: editingId ? "התשלום עודכן" : "התשלום נשמר" });
    setForm(empty); setEditingId(null); setOpen(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את התשלום?")) return;
    const { error } = await supabase.from("payments").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "התשלום נמחק" }); load();
  };

  const settleInsurance = async (r: Payment) => {
    const remaining = Number(r.treatment_price) - Number(r.patient_paid);
    const { error } = await supabase.from("payments").update({
      insurance_paid: remaining > 0 ? remaining : Number(r.insurance_paid),
      needs_insurance_submission: false,
    }).eq("id", r.id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "סומן כשולם ע\"י הביטוח" }); load();
  };

  const total = rows.reduce((s, r) => s + Number(r.treatment_price), 0);
  const paid = rows.reduce((s, r) => s + Number(r.patient_paid) + Number(r.insurance_paid), 0);
  const balance = total - paid;
  const pendingInsurance = rows.filter((r) => r.needs_insurance_submission)
    .reduce((s, r) => s + (Number(r.treatment_price) - Number(r.patient_paid) - Number(r.insurance_paid)), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3"><p className="text-xs text-muted-foreground">סה"כ חיובים</p><p className="text-xl font-bold">₪{total}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">שולם</p><p className="text-xl font-bold text-primary">₪{paid}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">יתרה</p><p className={`text-xl font-bold ${balance > 0 ? "text-destructive" : ""}`}>₪{balance}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">ממתין מהביטוח</p><p className={`text-xl font-bold ${pendingInsurance > 0 ? "text-destructive" : ""}`}>₪{pendingInsurance}</p></Card>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={openNew}><Plus className="w-4 h-4" /> תשלום חדש</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl" className="max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? "עריכת תשלום" : "תשלום חדש"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>תאריך</Label>
              <Input type="date" dir="ltr" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>סוג תשלום</Label>
              <Select value={form.payment_type} onValueChange={(v: any) => setForm({ ...form, payment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">פרטי</SelectItem>
                  <SelectItem value="insurance">ביטוח</SelectItem>
                  <SelectItem value="mixed">משולב</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>מחיר טיפול</Label>
              <Input type="number" dir="ltr" value={form.treatment_price} onChange={(e) => setForm({ ...form, treatment_price: e.target.value })} required />
            </div>
            <div className="space-y-2"><Label>שולם ע"י המטופל</Label>
              <Input type="number" dir="ltr" value={form.patient_paid} onChange={(e) => setForm({ ...form, patient_paid: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>שולם ע"י הביטוח</Label>
              <Input type="number" dir="ltr" value={form.insurance_paid} onChange={(e) => setForm({ ...form, insurance_paid: e.target.value })} />
            </div>
            <div className="space-y-2"><Label>ספק ביטוח</Label>
              <Select value={form.insurance_provider} onValueChange={(v: any) => setForm({ ...form, insurance_provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא</SelectItem>
                  <SelectItem value="clalit_mushlam">כללית משלים</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 md:col-span-2 cursor-pointer">
              <Checkbox checked={form.needs_insurance_submission}
                onCheckedChange={(v) => setForm({ ...form, needs_insurance_submission: !!v })} />
              <span className="text-sm">ממתין להגשה/תשלום מהביטוח</span>
            </label>
            <div className="space-y-2 md:col-span-2"><Label>הערות</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter className="md:col-span-2">
              <Button type="submit" disabled={saving}>{saving ? "שומר…" : "שמור"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {rows.length === 0 && <p className="text-muted-foreground p-4">אין תשלומים.</p>}
      {rows.map((r) => {
        const bal = Number(r.treatment_price) - Number(r.patient_paid) - Number(r.insurance_paid);
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
            <div className="text-sm">שולם: <b>₪{Number(r.patient_paid) + Number(r.insurance_paid)}</b></div>
            <Badge variant={bal > 0 ? "destructive" : "default"}>יתרה ₪{bal}</Badge>
            {pending && <Badge variant="destructive">ממתין מהביטוח</Badge>}
            <div className="flex gap-1">
              {pending && (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => settleInsurance(r)}>
                  <Check className="w-4 h-4" /> שולם ע"י הביטוח
                </Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
