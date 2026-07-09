import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Note { id: string; content: string; created_at: string; }

export const NotesTab = ({ patientId }: { patientId: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("internal_notes").select("id, content, created_at")
      .eq("patient_id", patientId).is("deleted_at", null)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Note[]);
  };
  useEffect(() => { load(); }, [patientId]);

  const add = async () => {
    if (!text.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("internal_notes").insert({
      patient_id: patientId, content: text.trim(), created_by: user?.id ?? null,
    });
    setSaving(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    setText(""); load();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="הערה פנימית…" rows={3} />
        <div className="flex justify-end"><Button onClick={add} disabled={saving || !text.trim()}>הוסף הערה</Button></div>
      </Card>
      {rows.length === 0 && <p className="text-muted-foreground p-4">אין הערות.</p>}
      {rows.map((r) => (
        <Card key={r.id} className="p-3">
          <p className="text-xs text-muted-foreground" dir="ltr">{format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}</p>
          <p className="mt-1 whitespace-pre-wrap">{r.content}</p>
        </Card>
      ))}
    </div>
  );
};
