import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar as CalIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Reminder { id: string; suggested_date: string; priority: string; patient: { id: string; full_name: string } | null }
interface Appt { id: string; slot_at: string; child_name: string; status: string }

const NotificationsBell = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [today, setToday] = useState<Appt[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

      const [r, a] = await Promise.all([
        supabase.from("follow_up_reminders")
          .select("id, suggested_date, priority, patient:patients(id, full_name)")
          .eq("status", "pending").is("deleted_at", null)
          .lte("suggested_date", format(now, "yyyy-MM-dd"))
          .order("priority", { ascending: false }).limit(10),
        supabase.from("appointments")
          .select("id, slot_at, child_name, status")
          .gte("slot_at", startOfDay).lte("slot_at", endOfDay)
          .neq("status", "cancelled").order("slot_at").limit(10),
      ]);
      setReminders((r.data ?? []) as any);
      setToday((a.data ?? []) as any);
    })();
  }, []);

  const total = reminders.length + today.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {total > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[70vh] overflow-y-auto" dir="rtl">
        <div className="p-3 border-b font-semibold text-sm">התראות</div>
        {total === 0 && <div className="p-4 text-center text-sm text-muted-foreground">אין התראות</div>}

        {today.length > 0 && (
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
              <CalIcon className="w-3 h-3" /> תורים היום
            </div>
            {today.map(a => (
              <Link key={a.id} to="/admin/calendar"
                className="block px-2 py-2 rounded hover:bg-muted text-sm">
                <div className="flex justify-between">
                  <span className="font-medium truncate">{a.child_name}</span>
                  <span dir="ltr" className="text-xs text-muted-foreground">{format(new Date(a.slot_at), "HH:mm")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {reminders.length > 0 && (
          <div className="p-2 border-t">
            <div className="text-xs text-muted-foreground px-2 py-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> תזכורות מעקב
            </div>
            {reminders.map(r => (
              <Link key={r.id} to={r.patient ? `/admin/patients/${r.patient.id}` : "/admin/reminders"}
                className="block px-2 py-2 rounded hover:bg-muted text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{r.patient?.full_name ?? "—"}</span>
                  <Badge variant={r.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                    {r.priority === "high" ? "גבוהה" : r.priority === "low" ? "נמוכה" : "בינונית"}
                  </Badge>
                </div>
                <div dir="ltr" className="text-xs text-muted-foreground">{format(new Date(r.suggested_date), "dd/MM/yyyy")}</div>
              </Link>
            ))}
            <Link to="/admin/reminders" className="block text-center text-xs text-primary hover:underline p-2">
              כל התזכורות ←
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
