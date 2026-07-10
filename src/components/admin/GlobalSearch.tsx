import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, Calendar as CalIcon, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PatientHit { kind: "patient"; id: string; full_name: string; national_id: string | null; phone: string | null; }
interface ApptHit { kind: "appointment"; id: string; slot_at: string; child_name: string; patient_id: string | null; }
type Hit = PatientHit | ApptHit;

export const GlobalSearch = () => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const nav = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (term.length < 2) { setHits([]); return; }
      setLoading(true);
      const [p, a] = await Promise.all([
        supabase.from("patients")
          .select("id, full_name, national_id, phone")
          .is("deleted_at", null)
          .or(`full_name.ilike.%${term}%,national_id.ilike.%${term}%,phone.ilike.%${term}%,parent_name.ilike.%${term}%`)
          .limit(6),
        supabase.from("appointments")
          .select("id, slot_at, child_name, patient_id")
          .or(`child_name.ilike.%${term}%,phone.ilike.%${term}%,child_national_id.ilike.%${term}%`)
          .order("slot_at", { ascending: false }).limit(6),
      ]);
      const list: Hit[] = [
        ...((p.data ?? []).map((r: any) => ({ kind: "patient", ...r }))) as PatientHit[],
        ...((a.data ?? []).map((r: any) => ({ kind: "appointment", ...r }))) as ApptHit[],
      ];
      setHits(list);
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const go = (h: Hit) => {
    setOpen(false); setQ("");
    if (h.kind === "patient") nav(`/admin/patients/${h.id}`);
    else if (h.patient_id) nav(`/admin/patients/${h.patient_id}`);
    else nav("/admin/calendar");
  };

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="חיפוש: שם, ת.ז, טלפון…"
        className="pr-9 h-9"
      />
      {open && (q.trim().length >= 2) && (
        <div className="absolute top-full right-0 left-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-3 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> מחפש…
            </div>
          )}
          {!loading && hits.length === 0 && (
            <p className="p-3 text-center text-muted-foreground text-sm">לא נמצאו תוצאות</p>
          )}
          {!loading && hits.map((h) => (
            <button
              key={h.kind + h.id}
              onClick={() => go(h)}
              className="w-full text-right px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-0"
            >
              {h.kind === "patient" ? (
                <>
                  <User className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate" dir="ltr">
                      {h.national_id || ""} {h.phone ? `· ${h.phone}` : ""}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CalIcon className="w-4 h-4 text-accent shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.child_name}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {format(new Date(h.slot_at), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
