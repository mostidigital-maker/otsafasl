import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";

interface FileRow { id: string; file_name: string; storage_path: string; size_bytes: number | null; mime_type: string | null; created_at: string; category: string; }

export const FilesTab = ({ patientId }: { patientId: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<FileRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("patient_files").select("*")
      .eq("patient_id", patientId).is("deleted_at", null)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as FileRow[]);
  };
  useEffect(() => { load(); }, [patientId]);

  const upload = async (file: File) => {
    setUploading(true);
    const path = `${patientId}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("patient-files").upload(path, file);
    if (upErr) { setUploading(false); return toast({ title: "שגיאה", description: upErr.message, variant: "destructive" }); }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("patient_files").insert({
      patient_id: patientId, file_name: file.name, storage_path: path,
      size_bytes: file.size, mime_type: file.type, uploaded_by: user?.id ?? null,
    });
    setUploading(false);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "הקובץ הועלה" });
    if (inputRef.current) inputRef.current.value = "";
    load();
  };

  const download = async (r: FileRow) => {
    const { data, error } = await supabase.storage.from("patient-files").createSignedUrl(r.storage_path, 60);
    if (error || !data) return toast({ title: "שגיאה", description: error?.message, variant: "destructive" });
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (r: FileRow) => {
    if (!confirm("למחוק את הקובץ?")) return;
    await supabase.storage.from("patient-files").remove([r.storage_path]);
    await supabase.from("patient_files").update({ deleted_at: new Date().toISOString() }).eq("id", r.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button className="gap-2" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4" /> {uploading ? "מעלה…" : "העלה קובץ"}
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {rows.length === 0 && <p className="text-muted-foreground p-4">אין מסמכים.</p>}
      {rows.map((r) => (
        <Card key={r.id} className="p-3 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{r.file_name}</p>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {r.size_bytes ? `${Math.round(r.size_bytes / 1024)} KB · ` : ""}
              {format(new Date(r.created_at), "dd/MM/yyyy")}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => download(r)}><Download className="w-4 h-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => remove(r)}><Trash2 className="w-4 h-4" /></Button>
        </Card>
      ))}
    </div>
  );
};
