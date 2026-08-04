import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Pencil, X } from "lucide-react";
import type { Patient } from "@/pages/admin/PatientProfilePage";

export const InfoTab = ({ patient: p, onSaved }: { patient: Patient; onSaved: () => void }) => {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    full_name: p.full_name ?? "",
    national_id: p.national_id ?? "",
    date_of_birth: p.date_of_birth ?? "",
    gender: (p.gender ?? "") as string,
    parent_name: p.parent_name ?? "",
    phone: p.phone ?? "",
    email: p.email ?? "",
    address: p.address ?? "",
    emergency_contact: p.emergency_contact ?? "",
    emergency_phone: p.emergency_phone ?? "",
    notes: p.notes ?? "",
  });

  const startEdit = () => {
    setF({
      full_name: p.full_name ?? "",
      national_id: p.national_id ?? "",
      date_of_birth: p.date_of_birth ?? "",
      gender: (p.gender ?? "") as string,
      parent_name: p.parent_name ?? "",
      phone: p.phone ?? "",
      email: p.email ?? "",
      address: p.address ?? "",
      emergency_contact: p.emergency_contact ?? "",
      emergency_phone: p.emergency_phone ?? "",
      notes: p.notes ?? "",
    });
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.full_name.trim()) {
      return toast({ title: "שגיאה", description: "יש להזין שם מלא", variant: "destructive" });
    }
    setSaving(true);
    const { error } = await supabase.from("patients").update({
      full_name: f.full_name.trim(),
      national_id: f.national_id.trim() || null,
      date_of_birth: f.date_of_birth || null,
      gender: (f.gender || null) as never,
      parent_name: f.parent_name.trim() || null,
      phone: f.phone.trim() || null,
      email: f.email.trim() || null,
      address: f.address.trim() || null,
      emergency_contact: f.emergency_contact.trim() || null,
      emergency_phone: f.emergency_phone.trim() || null,
      notes: f.notes.trim() || null,
    }).eq("id", p.id);
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "הפרטים עודכנו בהצלחה" });
    setEditing(false);
    onSaved();
  };

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>שם מלא *</Label>
              <Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>ת.ז</Label>
              <Input dir="ltr" value={f.national_id} maxLength={9} onChange={(e) => setF({ ...f, national_id: e.target.value.replace(/\D/g, "") })} />
            </div>
            <div className="space-y-2">
              <Label>תאריך לידה</Label>
              <Input type="date" dir="ltr" value={f.date_of_birth} onChange={(e) => setF({ ...f, date_of_birth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>מין</Label>
              <Select value={f.gender} onValueChange={(v) => setF({ ...f, gender: v })}>
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
              <Input value={f.parent_name} onChange={(e) => setF({ ...f, parent_name: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>טלפון</Label>
              <Input dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>אימייל</Label>
              <Input type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>כתובת</Label>
              <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label>איש קשר חירום</Label>
              <Input value={f.emergency_contact} onChange={(e) => setF({ ...f, emergency_contact: e.target.value })} maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label>טלפון חירום</Label>
              <Input dir="ltr" value={f.emergency_phone} onChange={(e) => setF({ ...f, emergency_phone: e.target.value })} maxLength={20} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>הערות</Label>
              <Input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={1000} />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "שומר…" : "שמור שינויים"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} className="gap-2">
                <X className="w-4 h-4" /> ביטול
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const info: { label: string; value: string | null }[] = [
    { label: "ת.ז", value: p.national_id },
    { label: "תאריך לידה", value: p.date_of_birth },
    { label: "מין", value: p.gender === "male" ? "זכר" : p.gender === "female" ? "נקבה" : p.gender },
    { label: "שם הורה", value: p.parent_name },
    { label: "טלפון", value: p.phone },
    { label: "אימייל", value: p.email },
    { label: "כתובת", value: p.address },
    { label: "איש קשר חירום", value: p.emergency_contact },
    { label: "טלפון חירום", value: p.emergency_phone },
    { label: "הערות", value: p.notes },
  ];

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={startEdit} className="gap-2">
            <Pencil className="w-4 h-4" /> עריכת פרטים
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {info.map((i) => (
            <div key={i.label} className="border-b border-border pb-2">
              <p className="text-xs text-muted-foreground">{i.label}</p>
              <p className="font-medium">{i.value || "—"}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
