import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2, Pencil } from "lucide-react";

interface Loc {
  id: string;
  slug: string;
  name_he: string;
  name_ar: string;
  name_en: string;
  address_he: string | null;
  address_ar: string | null;
  address_en: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm = {
  name_he: "",
  name_ar: "",
  name_en: "",
  address_he: "",
  address_ar: "",
  address_en: "",
};

const slugify = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9\u0590-\u05ff\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "") ||
  `loc-${Date.now()}`;

export const LocationsManager = () => {
  const { toast } = useToast();
  const [locs, setLocs] = useState<Loc[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Loc | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("locations").select("*").order("sort_order");
    setLocs((data ?? []) as Loc[]);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (l: Loc) => {
    const { error } = await supabase.from("locations").update({ is_active: !l.is_active }).eq("id", l.id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: !l.is_active ? "המקום נפתח לקביעת תורים" : "המקום נסגר לקביעת תורים" });
    load();
  };

  const startNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const startEdit = (l: Loc) => {
    setEditing(l);
    setForm({
      name_he: l.name_he, name_ar: l.name_ar, name_en: l.name_en,
      address_he: l.address_he ?? "", address_ar: l.address_ar ?? "", address_en: l.address_en ?? "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name_he: form.name_he,
      name_ar: form.name_ar || form.name_he,
      name_en: form.name_en || form.name_he,
      address_he: form.address_he || null,
      address_ar: form.address_ar || null,
      address_en: form.address_en || null,
    };
    const { error } = editing
      ? await supabase.from("locations").update(payload).eq("id", editing.id)
      : await supabase.from("locations").insert({
          ...payload,
          slug: slugify(form.name_en || form.name_he),
          is_active: true,
          sort_order: (locs.length ? locs[locs.length - 1].sort_order : 0) + 1,
        });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: editing ? "המקום עודכן" : "המקום נוסף" });
    setOpen(false); setEditing(null); setForm(emptyForm); load();
  };

  const remove = async (l: Loc) => {
    if (!confirm(`למחוק את המקום "${l.name_he}"? שעות הפעילות שלו יימחקו גם.`)) return;
    await supabase.from("working_hours").delete().eq("location_id", l.id);
    await supabase.from("blocked_slots").delete().eq("location_id", l.id);
    const { error } = await supabase.from("locations").delete().eq("id", l.id);
    if (error) {
      return toast({
        title: "לא ניתן למחוק",
        description: "יש תורים המשויכים למקום הזה. אפשר לסגור אותו במקום למחוק.",
        variant: "destructive",
      });
    }
    toast({ title: "המקום נמחק" });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          סגירת מקום מסתירה אותו מטופס קביעת התורים באתר ומשעות הפעילות המוצגות בדף הראשי.
        </p>
        <Button size="sm" className="gap-2 shrink-0" onClick={startNew}>
          <Plus className="w-4 h-4" /> מקום חדש
        </Button>
      </div>

      {locs.map((l) => (
        <div key={l.id} className="flex items-center gap-3 border rounded-lg p-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{l.name_he}</div>
            <div className="text-xs text-muted-foreground truncate">{l.address_he || l.name_ar}</div>
          </div>
          <Badge variant={l.is_active ? "default" : "secondary"}>{l.is_active ? "פתוח" : "סגור"}</Badge>
          <Switch checked={l.is_active} onCheckedChange={() => toggle(l)} />
          <Button variant="ghost" size="icon" onClick={() => startEdit(l)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => remove(l)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ))}
      {locs.length === 0 && <p className="text-sm text-muted-foreground">אין מקומות מוגדרים.</p>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir="rtl">
          <DialogHeader><DialogTitle>{editing ? "עריכת מקום" : "מקום חדש"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-2">
              <Label>שם המקום (עברית) *</Label>
              <Input value={form.name_he} required onChange={(e) => setForm({ ...form, name_he: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>שם בערבית</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>שם באנגלית</Label>
                <Input dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>כתובת (עברית)</Label>
              <Input value={form.address_he} onChange={(e) => setForm({ ...form, address_he: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>כתובת בערבית</Label>
                <Input value={form.address_ar} onChange={(e) => setForm({ ...form, address_ar: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>כתובת באנגלית</Label>
                <Input dir="ltr" value={form.address_en} onChange={(e) => setForm({ ...form, address_en: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving ? "שומר…" : "שמור"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
