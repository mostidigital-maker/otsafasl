import { useEffect, useMemo, useState } from "react";
import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format,
  isSameMonth, isToday, startOfMonth, startOfWeek, subMonths, subWeeks,
} from "date-fns";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, ExternalLink, CheckCircle2, UserCheck, XCircle, ClipboardList, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "cancelled" | "arrived" | "completed" | "no_show";

interface Appointment {
  id: string;
  location_id: string;
  slot_at: string;
  child_name: string;
  child_age: string | null;
  parent_name: string;
  phone: string;
  status: Status;
  patient_id: string | null;
}
interface Loc { id: string; name_he: string }

type View = "month" | "week" | "day";

const statusMeta: Record<Status, { label: string; cls: string }> = {
  pending:   { label: "ממתין",  cls: "bg-primary/10 text-primary border-primary/30" },
  confirmed: { label: "אושר",   cls: "bg-accent/15 text-accent border-accent/30" },
  arrived:   { label: "הגיע",   cls: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  completed: { label: "בוצע",   cls: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  cancelled: { label: "בוטל",   cls: "bg-destructive/10 text-destructive border-destructive/30 line-through opacity-70" },
  no_show:   { label: "לא הגיע", cls: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
};

const CalendarPage = () => {
  const nav = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [locFilter, setLocFilter] = useState<string>("all");
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [dayDialog, setDayDialog] = useState<Date | null>(null);

  const load = async () => {
    const [a, l] = await Promise.all([
      supabase.from("appointments").select("id,location_id,slot_at,child_name,child_age,parent_name,phone,status,patient_id").is("deleted_at", null).order("slot_at"),
      supabase.from("locations").select("id,name_he"),
    ]);
    if (a.data) setRows(a.data as Appointment[]);
    if (l.data) setLocs(l.data as Loc[]);
  };
  useEffect(() => { load(); }, []);

  const locMap = useMemo(() => Object.fromEntries(locs.map(l => [l.id, l.name_he])), [locs]);
  const filtered = useMemo(
    () => rows.filter(r => locFilter === "all" || r.location_id === locFilter),
    [rows, locFilter]
  );
  const byDay = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const r of filtered) {
      const k = format(new Date(r.slot_at), "yyyy-MM-dd");
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return m;
  }, [filtered]);
  const getDay = (d: Date) =>
    (byDay.get(format(d, "yyyy-MM-dd")) ?? []).sort(
      (a, b) => new Date(a.slot_at).getTime() - new Date(b.slot_at).getTime()
    );

  const setStatus = async (id: string, status: Status) => {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "עודכן" });
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const removeAppointment = async (id: string) => {
    if (!confirm("למחוק את התור לצמיתות?")) return;
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: "התור נמחק" });
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const goPrev = () => setCursor(view === "month" ? subMonths(cursor, 1) : view === "week" ? subWeeks(cursor, 1) : addDays(cursor, -1));
  const goNext = () => setCursor(view === "month" ? addMonths(cursor, 1) : view === "week" ? addWeeks(cursor, 1) : addDays(cursor, 1));

  const weekdays = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
  const monthsHe = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
  const monthLabel = `${monthsHe[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">יומן תורים</h1>
        <p className="text-sm text-muted-foreground">ניהול, סינון ועדכון סטטוס תורים</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={goPrev}><ChevronRight className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>היום</Button>
          <Button variant="outline" size="icon" onClick={goNext}><ChevronLeft className="w-4 h-4" /></Button>
          <div className="ms-3 font-bold text-lg">
            {view === "month" ? monthLabel
              : view === "week" ? `${format(weekStart, "dd/MM")} – ${format(addDays(weekStart, 6), "dd/MM/yyyy")}`
              : format(cursor, "EEEE, dd/MM/yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={locFilter} onValueChange={setLocFilter}>
            <SelectTrigger className="w-44"><MapPin className="w-4 h-4 ms-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסניפים</SelectItem>
              {locs.map(l => <SelectItem key={l.id} value={l.id}>{l.name_he}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            {(["month","week","day"] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn("px-3 py-1.5 text-sm border-s border-border first:border-s-0",
                  view === v ? "bg-primary text-primary-foreground" : "bg-card")}>
                {v === "month" ? "חודש" : v === "week" ? "שבוע" : "יום"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "month" && <MonthGrid cursor={cursor} getDay={getDay} weekdays={weekdays} onPickDay={setDayDialog} />}
      {view === "week"  && <WeekGrid  weekStart={weekStart} getDay={getDay} weekdays={weekdays} locMap={locMap} onPickDay={setDayDialog} />}
      {view === "day"   && <DayList day={cursor} items={getDay(cursor)} locMap={locMap} onOpen={() => setDayDialog(cursor)} />}

      <Dialog open={!!dayDialog} onOpenChange={(o) => !o && setDayDialog(null)}>
        <DialogContent className="max-w-xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{dayDialog && format(dayDialog, "EEEE, dd/MM/yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[65vh] overflow-y-auto">
            {dayDialog && getDay(dayDialog).length === 0 && (
              <p className="text-center text-muted-foreground py-6">אין תורים ביום זה</p>
            )}
            {dayDialog && getDay(dayDialog).map(a => (
              <div key={a.id} className={cn("rounded-lg border p-3 space-y-2", statusMeta[a.status].cls)}>
                <div className="flex items-center justify-between">
                  <span dir="ltr" className="font-bold text-base">{format(new Date(a.slot_at), "HH:mm")}</span>
                  <Badge variant="outline" className="text-[10px]">{statusMeta[a.status].label}</Badge>
                </div>
                <div className="text-sm font-medium">
                  {a.child_name}{a.child_age ? ` (${a.child_age})` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {a.parent_name} · <span dir="ltr">{a.phone}</span> · {locMap[a.location_id] ?? ""}
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setStatus(a.id, "arrived")}>
                    <UserCheck className="w-3 h-3" /> הגיע
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setStatus(a.id, "completed")}>
                    <CheckCircle2 className="w-3 h-3" /> בוצע
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setStatus(a.id, "no_show")}>
                    <XCircle className="w-3 h-3" /> לא הגיע
                  </Button>
                  {a.patient_id && (
                    <>
                      <Button size="sm" variant="secondary" className="h-7 text-xs gap-1"
                        onClick={() => nav(`/admin/patients/${a.patient_id}?tab=treatments`)}>
                        <ClipboardList className="w-3 h-3" /> תיעוד טיפול
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1"
                        onClick={() => nav(`/admin/patients/${a.patient_id}`)}>
                        <ExternalLink className="w-3 h-3" /> פרופיל
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                    onClick={() => removeAppointment(a.id)}>
                    <Trash2 className="w-3 h-3" /> מחיקה
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MonthGrid = ({ cursor, getDay, weekdays, onPickDay }: {
  cursor: Date; getDay: (d: Date) => Appointment[]; weekdays: string[]; onPickDay: (d: Date) => void;
}) => {
  const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/40 text-xs font-semibold text-muted-foreground">
        {weekdays.map(w => <div key={w} className="px-2 py-2 text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map(d => {
          const items = getDay(d);
          const inMonth = isSameMonth(d, cursor);
          return (
            <button key={d.toISOString()} onClick={() => onPickDay(d)}
              className={cn("min-h-[110px] border-t border-s border-border p-1.5 text-start hover:bg-muted/40 transition",
                !inMonth && "bg-muted/20 text-muted-foreground")}>
              <div className="flex items-center justify-between mb-1">
                <span className={cn("text-xs w-6 h-6 inline-flex items-center justify-center rounded-full",
                  isToday(d) && "bg-primary text-primary-foreground font-bold")}>{d.getDate()}</span>
                {items.length > 0 && <span className="text-[10px] bg-accent/20 text-accent rounded-full px-1.5">{items.length}</span>}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map(a => (
                  <div key={a.id} dir="ltr" className={cn("truncate text-[10px] rounded px-1 py-0.5 border", statusMeta[a.status].cls)}>
                    {format(new Date(a.slot_at), "HH:mm")} {a.child_name}
                  </div>
                ))}
                {items.length > 3 && <div className="text-[10px] text-muted-foreground">+{items.length - 3}</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const WeekGrid = ({ weekStart, getDay, weekdays, locMap, onPickDay }: {
  weekStart: Date; getDay: (d: Date) => Appointment[]; weekdays: string[];
  locMap: Record<string, string>; onPickDay: (d: Date) => void;
}) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/40 text-xs font-semibold text-muted-foreground">
        {days.map((d, i) => (
          <div key={d.toISOString()} className="px-2 py-2 text-center">
            <div>{weekdays[i]}</div>
            <div className={cn("text-base mt-0.5", isToday(d) && "text-primary font-bold")}>{d.getDate()}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(d => {
          const items = getDay(d);
          return (
            <button key={d.toISOString()} onClick={() => onPickDay(d)}
              className="min-h-[300px] border-t border-s border-border p-2 text-start hover:bg-muted/40 transition space-y-1">
              {items.length === 0 && <div className="text-[11px] text-muted-foreground/70 text-center mt-4">—</div>}
              {items.map(a => (
                <div key={a.id} className={cn("rounded-md border px-1.5 py-1", statusMeta[a.status].cls)}>
                  <div dir="ltr" className="text-[11px] font-bold">{format(new Date(a.slot_at), "HH:mm")}</div>
                  <div className="text-xs font-medium truncate">{a.child_name}</div>
                  <div className="text-[10px] truncate opacity-80">{locMap[a.location_id] ?? ""}</div>
                </div>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const DayList = ({ day, items, locMap, onOpen }: {
  day: Date; items: Appointment[]; locMap: Record<string, string>; onOpen: () => void;
}) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="font-bold">{format(day, "EEEE, dd/MM/yyyy")}</h3>
      <Button size="sm" variant="outline" onClick={onOpen}>ניהול תורים</Button>
    </div>
    {items.length === 0 && <p className="text-muted-foreground text-center py-8">אין תורים ביום זה</p>}
    <div className="space-y-2">
      {items.map(a => (
        <div key={a.id} className={cn("rounded-lg border p-3 flex items-center justify-between gap-3", statusMeta[a.status].cls)}>
          <div className="flex items-center gap-3">
            <div dir="ltr" className="font-bold text-lg w-16">{format(new Date(a.slot_at), "HH:mm")}</div>
            <div>
              <div className="font-medium">{a.child_name}</div>
              <div className="text-xs text-muted-foreground">{a.parent_name} · <span dir="ltr">{a.phone}</span> · {locMap[a.location_id] ?? ""}</div>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">{statusMeta[a.status].label}</Badge>
        </div>
      ))}
    </div>
  </div>
);

export default CalendarPage;
