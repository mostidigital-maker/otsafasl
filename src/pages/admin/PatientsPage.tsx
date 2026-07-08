import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, User } from "lucide-react";

type Gender = "male" | "female" | "other";
interface Patient {
  id: string; full_name: string; national_id: string | null; phone: string | null;
  parent_name: string | null; date_of_birth: string | null; gender: Gender | null;
}

const emptyForm = {
  full_name: "", national_id: "", phone: "", parent_name: "",
  date_of_birth: "", gender: "" as "" | Gender, email: "", address: "", notes: "",
};

const PatientsPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Patient[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("id, full_name, national_id, phone, parent_name, date_of_birth, gender")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setRows((data ?? []) as Patient[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return [r.full_name, r.national_id, r.phone, r.parent_name].some((x) => x?.toLowerCase().includes(s));
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      return toast({ title: "שגיאה", description: "יש להזין שם מלא", variant: "destructive" });
    }
    setSaving(true);
    const { error } = await supabase.from("patients").insert({
      full_name: form.full_name.trim(),
      national_id: form.national_id.trim() || null,
      phone: form.phone.trim() || null,
      parent_name: form.parent_name.trim() || null,
      date_of_birth: form.date_of_birth || null,
      gender: (form.gender || null) as Gender | null,
      email: form.email.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "המטופל נוסף בהצלחה" });
    setForm(emptyForm); setOpen(false); load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">מטופלים</h1>
          <p className="text-muted-foreground text-sm">ניהול פרופילי המטופלים</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> מטופל חדש</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader><DialogTitle>מטופל חדש</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>שם מלא *</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label>תעודת זהות</Label>
                <Input value={form.national_id} dir="ltr" onChange={(e) => setForm({ ...form, national_id: e.target.value.replace(/\D/g, "") })} maxLength={9} />
              </div>
              <div className="space-y-2">
                <Label>תאריך לידה</Label>
                <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>מין</Label>
                <Select value={form.gender} onValueChange={(v: Gender) => setForm({ ...form, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="בחר" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">זכר</SelectItem>
                    <SelectItem value="female">נקבה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>שם הורה</Label>
                <Input value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label>טלפון</Label>
                <Input value={form.phone} dir="ltr" onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>אימייל</Label>
                <Input type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>כתובת</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={255} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>הערות</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
              </div>
              <DialogFooter className="md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "שומר…" : "שמור"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="חיפוש לפי שם, טלפון, ת.ז או שם הורה" value={q} onChange={(e) => setQ(e.target.value)} className="pr-10" />
        </div>
        <div className="rounded-lg border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>ת.ז</TableHead>
                <TableHead>הורה</TableHead>
                <TableHead>טלפון</TableHead>
                <TableHead>תאריך לידה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">טוען…</TableCell></TableRow>}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">אין מטופלים להצגה</TableCell></TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link to={`/admin/patients/${r.id}`} className="flex items-center gap-2 text-primary font-medium hover:underline">
                      <User className="w-4 h-4" /> {r.full_name}
                    </Link>
                  </TableCell>
                  <TableCell dir="ltr" className="text-xs">{r.national_id || "—"}</TableCell>
                  <TableCell>{r.parent_name || "—"}</TableCell>
                  <TableCell dir="ltr">{r.phone || "—"}</TableCell>
                  <TableCell dir="ltr">{r.date_of_birth || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PatientsPage;
