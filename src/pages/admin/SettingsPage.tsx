import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface Therapist {
  id: string; full_name: string; title: string | null;
  phone: string | null; email: string | null; is_active: boolean;
}

const SettingsPage = () => {
  const { toast } = useToast();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", title: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("therapists").select("*")
      .is("deleted_at", null).order("created_at", { ascending: false });
    setTherapists((data ?? []) as Therapist[]);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("therapists").insert({
      full_name: form.full_name,
      title: form.title || null,
      phone: form.phone || null,
      email: form.email || null,
      is_active: true,
    });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "המטפל נוסף" });
    setForm({ full_name: "", title: "", phone: "", email: "" });
    setOpen(false); load();
  };

  const toggleActive = async (t: Therapist) => {
    await supabase.from("therapists").update({ is_active: !t.is_active }).eq("id", t.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("להסיר מטפל?")) return;
    await supabase.from("therapists").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground text-sm">צוות הקליניקה, שעות פעילות, מקומות וחסימות תורים</p>
      </div>

      <Tabs defaultValue="hours">
        <TabsList className="flex-wrap">
          <TabsTrigger value="hours">שעות פעילות</TabsTrigger>
          <TabsTrigger value="locations">מקומות</TabsTrigger>
          <TabsTrigger value="blocked">חסימת תורים</TabsTrigger>
          <TabsTrigger value="team">מטפלים</TabsTrigger>
        </TabsList>

        <TabsContent value="hours" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">שעות פעילות לקביעת תורים</CardTitle></CardHeader>
            <CardContent><WorkingHoursManager /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">מקומות טיפול</CardTitle></CardHeader>
            <CardContent><LocationsManager /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">חסימת טווחי זמן</CardTitle></CardHeader>
            <CardContent><BlockedSlotsManager /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
      <Card>

        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">מטפלים</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> מטפל חדש</Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>מטפל חדש</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-3">
                <div className="space-y-2">
                  <Label>שם מלא *</Label>
                  <Input value={form.full_name} required onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>תואר / התמחות</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>טלפון</Label>
                  <Input dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>אימייל</Label>
                  <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>{saving ? "שומר…" : "שמור"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-2">
          {therapists.length === 0 && <p className="text-muted-foreground text-sm">אין מטפלים רשומים.</p>}
          {therapists.map(t => (
            <div key={t.id} className="flex items-center gap-3 border rounded-lg p-3">
              <div className="flex-1">
                <div className="font-medium">{t.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.title || "—"} {t.phone && <span dir="ltr"> · {t.phone}</span>} {t.email && <span dir="ltr"> · {t.email}</span>}
                </div>
              </div>
              <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "פעיל" : "לא פעיל"}</Badge>
              <Switch checked={t.is_active} onCheckedChange={() => toggleActive(t)} />
              <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
