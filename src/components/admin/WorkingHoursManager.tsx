import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface WH { id: string; location_id: string; weekday: number; opens_at: string; closes_at: string; slot_minutes: number; is_active: boolean }
interface Loc { id: string; name_ar: string; name_he: string; name_en: string }

export const WorkingHoursManager = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [locs, setLocs] = useState<Loc[]>([]);
  const [hours, setHours] = useState<WH[]>([]);
  const [locationId, setLocationId] = useState<string>("");
  const [form, setForm] = useState({ weekday: 0, opens_at: "09:00", closes_at: "17:00", slot_minutes: 45 });

  const load = async () => {
    const { data } = await supabase.from("working_hours").select("*").order("weekday");
    if (data) setHours(data as WH[]);
  };

  useEffect(() => {
    supabase.from("locations").select("*").order("sort_order").then(({ data }) => {
      if (data) { setLocs(data as Loc[]); if (data[0]) setLocationId(data[0].id); }
    });
    load();
  }, []);

  const add = async () => {
    if (!locationId) return;
    const { error } = await supabase.from("working_hours").insert({ ...form, location_id: locationId, is_active: true });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: t.admin.whSaved });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("למחוק את שעת הפעילות?")) return;
    await supabase.from("working_hours").delete().eq("id", id);
    load();
  };

  const toggle = async (h: WH) => {
    const { error } = await supabase.from("working_hours").update({ is_active: !h.is_active }).eq("id", h.id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    load();
  };

  const filtered = hours.filter((h) => h.location_id === locationId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="min-w-[180px]">
          <label className="text-sm font-medium">{t.admin.colLocation}</label>
          <Select value={locationId} onValueChange={setLocationId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {locs.map((l) => <SelectItem key={l.id} value={l.id}>{l[`name_${lang}` as const]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-semibold">{t.admin.whAdd}</h3>
        <div className="grid sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-sm">{t.admin.whWeekday}</label>
            <Select value={String(form.weekday)} onValueChange={(v) => setForm({ ...form, weekday: +v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {t.admin.weekdays.map((w, i) => <SelectItem key={i} value={String(i)}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm">{t.admin.whOpens}</label>
            <Input type="time" value={form.opens_at} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} dir="ltr" />
          </div>
          <div>
            <label className="text-sm">{t.admin.whCloses}</label>
            <Input type="time" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} dir="ltr" />
          </div>
          <div>
            <label className="text-sm">{t.admin.whSlot}</label>
            <Input type="number" min={15} max={180} value={form.slot_minutes} onChange={(e) => setForm({ ...form, slot_minutes: +e.target.value })} dir="ltr" />
          </div>
          <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> {t.admin.whAdd}</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.whWeekday}</TableHead>
              <TableHead>{t.admin.whOpens}</TableHead>
              <TableHead>{t.admin.whCloses}</TableHead>
              <TableHead>{t.admin.whSlot}</TableHead>
              <TableHead>פעיל</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">אין שעות פעילות למקום זה.</TableCell></TableRow>
            )}
            {filtered.map((h) => (
              <TableRow key={h.id} className={h.is_active ? "" : "opacity-60"}>
                <TableCell>{t.admin.weekdays[h.weekday]}</TableCell>
                <TableCell dir="ltr">{h.opens_at.slice(0, 5)}</TableCell>
                <TableCell dir="ltr">{h.closes_at.slice(0, 5)}</TableCell>
                <TableCell dir="ltr">{h.slot_minutes}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch checked={h.is_active} onCheckedChange={() => toggle(h)} />
                    <Badge variant={h.is_active ? "default" : "secondary"}>{h.is_active ? "פתוח" : "סגור"}</Badge>
                  </div>
                </TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(h.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
