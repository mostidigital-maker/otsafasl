import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface BS { id: string; location_id: string; start_at: string; end_at: string; reason: string | null }
interface Loc { id: string; name_ar: string; name_he: string; name_en: string }

export const BlockedSlotsManager = () => {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [locs, setLocs] = useState<Loc[]>([]);
  const [items, setItems] = useState<BS[]>([]);
  const [locationId, setLocationId] = useState("");
  const [form, setForm] = useState({ start_at: "", end_at: "", reason: "" });

  const load = async () => {
    const { data } = await supabase.from("blocked_slots").select("*").order("start_at");
    if (data) setItems(data as BS[]);
  };

  useEffect(() => {
    supabase.from("locations").select("*").order("sort_order").then(({ data }) => {
      if (data) { setLocs(data as Loc[]); if (data[0]) setLocationId(data[0].id); }
    });
    load();
  }, []);

  const add = async () => {
    if (!locationId || !form.start_at || !form.end_at) return;
    const { error } = await supabase.from("blocked_slots").insert({
      location_id: locationId,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      reason: form.reason || null,
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setForm({ start_at: "", end_at: "", reason: "" });
    load();
  };

  const remove = async (id: string) => { await supabase.from("blocked_slots").delete().eq("id", id); load(); };
  const filtered = items.filter((i) => i.location_id === locationId);

  return (
    <div className="space-y-6">
      <div className="min-w-[180px] max-w-xs">
        <label className="text-sm font-medium">{t.admin.colLocation}</label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {locs.map((l) => <SelectItem key={l.id} value={l.id}>{l[`name_${lang}` as const]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h3 className="font-semibold">{t.admin.blockedAdd}</h3>
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm">{t.admin.blockedFrom}</label>
            <Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} dir="ltr" />
          </div>
          <div>
            <label className="text-sm">{t.admin.blockedTo}</label>
            <Input type="datetime-local" value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })} dir="ltr" />
          </div>
          <div>
            <label className="text-sm">{t.admin.blockedReason}</label>
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} maxLength={200} />
          </div>
          <Button onClick={add} className="gap-2"><Plus className="w-4 h-4" /> {t.admin.blockedAdd}</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.admin.blockedFrom}</TableHead>
              <TableHead>{t.admin.blockedTo}</TableHead>
              <TableHead>{t.admin.blockedReason}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">{t.admin.blockedNone}</TableCell></TableRow>}
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell dir="ltr">{new Date(i.start_at).toLocaleString()}</TableCell>
                <TableCell dir="ltr">{new Date(i.end_at).toLocaleString()}</TableCell>
                <TableCell>{i.reason}</TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
