import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogRow {
  id: string;
  created_at: string;
  channel: string;
  template_key: string | null;
  to_phone: string | null;
  body_text: string | null;
  status: "sent" | "failed" | "opened";
  error_message: string | null;
}

const STATUS_META: Record<LogRow["status"], { label: string; variant: "default" | "destructive" | "secondary" }> = {
  sent: { label: "נשלח", variant: "default" },
  opened: { label: "נפתח לשליחה", variant: "secondary" },
  failed: { label: "נכשל", variant: "destructive" },
};

const TEMPLATE_LABEL: Record<string, string> = {
  appointment_confirmed: "אישור תור",
  appointment_cancelled: "ביטול תור",
};

export const MessageLogViewer = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  useLiveRefresh(["message_log"], () => load());
  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("message_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as LogRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          100 ההודעות האחרונות. "נפתח לשליחה" = הצוות פתח את וואטסאפ עם ההודעה (השליחה בפועל תלויה שילחצו Send שם). "נשלח"/"נכשל" יופיעו רק אחרי חיבור API אוטומטי.
        </p>
        <Button variant="outline" size="sm" className="gap-1" onClick={load} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> רענון
        </Button>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground border rounded-lg p-4 text-center">
          עדיין לא נשלחה אף הודעת וואטסאפ.
        </p>
      )}

      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.id} className="border rounded-lg p-3 flex items-start gap-3">
            <Badge variant={STATUS_META[r.status].variant} className="mt-0.5 shrink-0">
              {STATUS_META[r.status].label}
            </Badge>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {TEMPLATE_LABEL[r.template_key ?? ""] ?? r.template_key ?? "—"}
                {r.to_phone && <span dir="ltr" className="text-muted-foreground font-normal"> · {r.to_phone}</span>}
              </div>
              {r.body_text && <div className="text-xs text-muted-foreground truncate mt-0.5">{r.body_text}</div>}
              {r.error_message && <div className="text-xs text-destructive mt-0.5">{r.error_message}</div>}
            </div>
            <div className="text-xs text-muted-foreground shrink-0">
              {new Date(r.created_at).toLocaleString("he-IL")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
