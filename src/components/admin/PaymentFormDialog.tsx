import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentRecord {
  id: string;
  patient_id?: string | null;
  payment_date: string;
  treatment_price: number;
  patient_paid: number;
  insurance_paid: number;
  payment_type: string;
  insurance_provider: string | null;
  needs_insurance_submission: boolean;
  notes?: string | null;
}

/** יתרה שטרם התקבלה בפועל — תשלום ביטוח שממתין לאישור אינו נחשב כשולם */
export const effectivePaid = (r: {
  patient_paid: number | string;
  insurance_paid: number | string;
  needs_insurance_submission: boolean;
}) => Number(r.patient_paid) + (r.needs_insurance_submission ? 0 : Number(r.insurance_paid));

export const balanceOf = (r: {
  treatment_price: number | string;
  patient_paid: number | string;
  insurance_paid: number | string;
  needs_insurance_submission: boolean;
}) => Number(r.treatment_price) - effectivePaid(r);

const empty = {
  payment_date: new Date().toISOString().slice(0, 10),
  treatment_price: "",
  patient_paid: "0",
  insurance_paid: "0",
  payment_type: "private",
  insurance_provider: "none",
  needs_insurance_submission: false,
  notes: "",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientId?: string | null;
  payment?: PaymentRecord | null;
  onSaved: () => void;
}

export const PaymentFormDialog = ({ open, onOpenChange, patientId, payment, onSaved }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (payment) {
      setForm({
        payment_date: payment.payment_date.slice(0, 10),
        treatment_price: String(payment.treatment_price),
        patient_paid: String(payment.patient_paid),
        insurance_paid: String(payment.insurance_paid),
        payment_type: payment.payment_type,
        insurance_provider: payment.insurance_provider ?? "none",
        needs_insurance_submission: payment.needs_insurance_submission,
        notes: payment.notes ?? "",
      });
    } else {
      setForm(empty);
    }
  }, [open, payment]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      payment_date: form.payment_date,
      treatment_price: Number(form.treatment_price) || 0,
      patient_paid: Number(form.patient_paid) || 0,
      insurance_paid: Number(form.insurance_paid) || 0,
      payment_type: form.payment_type,
      insurance_provider: form.insurance_provider === "none" ? null : form.insurance_provider,
      needs_insurance_submission: form.needs_insurance_submission,
      notes: form.notes || null,
    } as any;
    const { error } = payment
      ? await supabase.from("payments").update(payload).eq("id", payment.id)
      : await supabase.from("payments").insert({ ...payload, patient_id: patientId });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: payment ? "התשלום עודכן" : "התשלום נשמר" });
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-xl">
        <DialogHeader><DialogTitle>{payment ? "עריכת תשלום" : "תשלום חדש"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label>תאריך</Label>
            <Input type="date" dir="ltr" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
          </div>
          <div className="space-y-2"><Label>סוג תשלום</Label>
            <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
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
            <Select value={form.insurance_provider} onValueChange={(v) => setForm({ ...form, insurance_provider: v })}>
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
            <span className="text-sm">ממתין להגשה/תשלום מהביטוח (הסכום ייחשב כיתרה פתוחה)</span>
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
  );
};

/** סימון תשלום כשולם ע"י הביטוח — מאפס את היתרה */
export const settlePayment = async (r: PaymentRecord) => {
  const needed = Number(r.treatment_price) - Number(r.patient_paid);
  return supabase.from("payments").update({
    insurance_paid: Math.max(needed > 0 ? needed : 0, 0),
    needs_insurance_submission: false,
  }).eq("id", r.id);
};
