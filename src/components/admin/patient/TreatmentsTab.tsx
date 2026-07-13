import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileDown } from "lucide-react";
import { format } from "date-fns";
import { generateTreatmentPDF } from "@/lib/pdf/treatmentSummary";

interface Treatment {
  id: string; treatment_date: string; summary: string | null; assessment: string | null;
  goals: string | null; activities: string | null; patient_response: string | null;
  progress: string | null; recommendations: string | null; home_exercises: string | null;
  next_plan: string | null; requires_follow_up: boolean; follow_up_date: string | null;
  follow_up_priority: string | null;
}

const emptyForm = {
  treatment_date: new Date().toISOString().slice(0, 10),
  summary: "", assessment: "", goals: "", activities: "", patient_response: "",
  progress: "", recommendations: "", home_exercises: "", next_plan: "",
  requires_follow_up: false, follow_up_date: "", follow_up_priority: "medium" as "low" | "medium" | "high",
};

export const TreatmentsTab = ({ patientId, patientName = "" }: { patientId: string; patientName?: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Treatment[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("treatments").select("*")
      .eq("patient_id", patientId).is("deleted_at", null)
      .order("treatment_date", { ascending: false });
    setRows((data ?? []) as Treatment[]);
  };

  useEffect(() => { load(); }, [patientId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: treatment, error } = await supabase.from("treatments").insert({
      patient_id: patientId,
      treatment_date: form.treatment_date,
      summary: form.summary || null,
      assessment: form.assessment || null,
      goals: form.goals || null,
      activities: form.activities || null,
      patient_response: form.patient_response || null,
      progress: form.progress || null,
      recommendations: form.recommendations || null,
      home_exercises: form.home_exercises || null,
      next_plan: form.next_plan || null,
      requires_follow_up: form.requires_follow_up,
      follow_up_date: form.requires_follow_up ? form.follow_up_date || null : null,
      follow_up_priority: form.requires_follow_up ? form.follow_up_priority : null,
    }).select().maybeSingle();

    if (error || !treatment) {
      setSaving(false);
      return toast({ title: "שגיאה", description: error?.message, variant: "destructive" });
    }

    if (form.requires_follow_up && form.follow_up_date) {
      await supabase.from("follow_up_reminders").insert({
        patient_id: patientId,
        treatment_id: treatment.id,
        suggested_date: form.follow_up_date,
        priority: form.follow_up_priority,
        status: "pending",
      });
    }

    setSaving(false);
    toast({ title: "הטיפול נשמר" });
    setForm(emptyForm); setOpen(false); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> תיעוד טיפול</Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>תיעוד טיפול חדש</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>תאריך הטיפול *</Label>
                <Input type="date" value={form.treatment_date} required
                  onChange={(e) => setForm({ ...form, treatment_date: e.target.value })} dir="ltr" />
              </div>
              <div />
              {[
                ["summary", "סיכום הטיפול"], ["assessment", "הערכה"],
                ["goals", "מטרות"], ["activities", "פעילויות שבוצעו"],
                ["patient_response", "תגובת המטופל"], ["progress", "התקדמות"],
                ["recommendations", "המלצות"], ["home_exercises", "תרגילי בית"],
                ["next_plan", "תוכנית להמשך"],
              ].map(([k, l]) => (
                <div key={k} className="space-y-2 md:col-span-2">
                  <Label>{l}</Label>
                  <Textarea rows={2} value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value } as any)} />
                </div>
              ))}
              <div className="md:col-span-2 flex items-center gap-3 border-t pt-3">
                <Switch checked={form.requires_follow_up} onCheckedChange={(v) => setForm({ ...form, requires_follow_up: v })} />
                <Label>נדרש תור נוסף</Label>
              </div>
              {form.requires_follow_up && (
                <>
                  <div className="space-y-2">
                    <Label>תאריך מוצע לתור הבא</Label>
                    <Input type="date" value={form.follow_up_date}
                      onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} dir="ltr" />
                  </div>
                  <div className="space-y-2">
                    <Label>עדיפות</Label>
                    <Select value={form.follow_up_priority} onValueChange={(v: any) => setForm({ ...form, follow_up_priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">נמוכה</SelectItem>
                        <SelectItem value="medium">בינונית</SelectItem>
                        <SelectItem value="high">גבוהה</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <DialogFooter className="md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "שומר…" : "שמור טיפול"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {rows.length === 0 && <p className="text-muted-foreground p-4">אין טיפולים מתועדים.</p>}
      {rows.map((r) => (
        <Card key={r.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex justify-between items-center gap-2">
              <span>טיפול</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground font-normal" dir="ltr">
                  {format(new Date(r.treatment_date), "dd/MM/yyyy")}
                </span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"
                  onClick={() => generateTreatmentPDF(patientName, r)}>
                  <FileDown className="w-3 h-3" /> PDF
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {r.summary && <div><span className="font-medium">סיכום: </span>{r.summary}</div>}
            {r.progress && <div><span className="font-medium">התקדמות: </span>{r.progress}</div>}
            {r.next_plan && <div><span className="font-medium">להמשך: </span>{r.next_plan}</div>}
            {r.requires_follow_up && r.follow_up_date && (
              <div className="text-primary">מעקב מתוכנן: {format(new Date(r.follow_up_date), "dd/MM/yyyy")}</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
