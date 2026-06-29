import { useEffect, useMemo, useState } from "react";
import {
  addDays, addMonths, addWeeks, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths, subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  location_id: string;
  slot_at: string;
  child_name: string;
  child_age: string | null;
  parent_name: string;
  phone: string;
  status: "pending" | "confirmed" | "cancelled";
}
interface Loc { id: string; name_ar: string; name_he: string; name_en: string }

type View = "month" | "week";

const statusColor = (s: Appointment["status"]) =>
  s === "confirmed" ? "bg-accent/15 text-accent border-accent/30"
  : s === "cancelled" ? "bg-destructive/10 text-destructive border-destructive/30 line-through opacity-60"
  : "bg-primary/10 text-primary border-primary/30";

export const AppointmentsCalendar = () => {
  const { t, lang, dir } = useLanguage();
  const [rows, setRows] = useState<Appointment[]>([]);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [locFilter, setLocFilter] = useState<string>("all");
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [dayDialog, setDayDialog] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const [a, l] = await Promise.all([
        supabase.from("appointments").select("id,location_id,slot_at,child_name,child_age,parent_name,phone,status").order("slot_at"),
        supabase.from("locations").select("id,name_ar,name_he,name_en"),
      ]);
      if (a.data) setRows(a.data as Appointment[]);
      if (l.data) setLocs(l.data as Loc[]);
    })();
  }, []);

  const locMap = useMemo(() => Object.fromEntries(locs.map(l => [l.id, l])), [locs]);
  const locName = (id: string) => (locMap[id] ? (locMap[id] as Loc)[`name_${lang}` as const] : "");

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

  const monthLabel = `${t.admin.calendar.monthsShort[cursor.getMonth()]} ${cursor.getFullYear()}`;
  const weekStart = startOfWeek(cursor, { weekStartsOn: 0 });

  const goPrev = () => setCursor(view === "month" ? subMonths(cursor, 1) : subWeeks(cursor, 1));
  const goNext = () => setCursor(view === "month" ? addMonths(cursor, 1) : addWeeks(cursor, 1));

  // Arrow direction respects RTL (visually prev = right arrow in RTL)
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={goPrev} title={t.admin.calendar.prev}><PrevIcon className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>{t.admin.calendar.today}</Button>
          <Button variant="outline" size="icon" onClick={goNext} title={t.admin.calendar.next}><NextIcon className="w-4 h-4" /></Button>
          <div className="ms-3 font-bold text-lg">
            {view === "month"
              ? monthLabel
              : `${format(weekStart, "dd/MM")} – ${format(addDays(weekStart, 6), "dd/MM/yyyy")}`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={locFilter} onValueChange={setLocFilter}>
            <SelectTrigger className="w-44"><MapPin className="w-4 h-4 me-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.admin.calendar.allLocations}</SelectItem>
              {locs.map(l => <SelectItem key={l.id} value={l.id}>{l[`name_${lang}` as const]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="inline-flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("month")} className={cn("px-3 py-1.5 text-sm", view === "month" ? "bg-primary text-primary-foreground" : "bg-card")}>{t.admin.calendar.month}</button>
            <button onClick={() => setView("week")} className={cn("px-3 py-1.5 text-sm border-s border-border", view === "week" ? "bg-primary text-primary-foreground" : "bg-card")}>{t.admin.calendar.week}</button>
          </div>
        </div>
      </div>

      {view === "month" ? (
        <MonthGrid cursor={cursor} getDay={getDay} weekdays={t.admin.weekdays} onPickDay={setDayDialog} locName={locName} />
      ) : (
        <WeekGrid weekStart={weekStart} getDay={getDay} weekdays={t.admin.weekdays} onPickDay={setDayDialog} locName={locName} />
      )}

      <Dialog open={!!dayDialog} onOpenChange={(o) => !o && setDayDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dayDialog && format(dayDialog, "EEEE, dd/MM/yyyy")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {dayDialog && getDay(dayDialog).length === 0 && (
              <p className="text-center text-muted-foreground py-6">{t.admin.calendar.noOnDay}</p>
            )}
            {dayDialog && getDay(dayDialog).map(a => (
              <div key={a.id} className={cn("rounded-lg border p-3 flex flex-col gap-1", statusColor(a.status))}>
                <div className="flex items-center justify-between">
                  <span dir="ltr" className="font-bold text-base">{format(new Date(a.slot_at), "HH:mm")}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {a.status === "pending" ? t.admin.filterPending : a.status === "confirmed" ? t.admin.filterConfirmed : t.admin.filterCancelled}
                  </Badge>
                </div>
                <div className="text-sm font-medium text-foreground">
                  {a.child_name}{a.child_age ? ` (${a.child_age})` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {a.parent_name} · <span dir="ltr">{a.phone}</span> · {locName(a.location_id)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------- Month grid ---------- */
const MonthGrid = ({
  cursor, getDay, weekdays, onPickDay, locName,
}: {
  cursor: Date;
  getDay: (d: Date) => Appointment[];
  weekdays: string[];
  onPickDay: (d: Date) => void;
  locName: (id: string) => string;
}) => {
  const monthStart = startOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/40 text-xs font-semibold text-muted-foreground">
        {weekdays.map((w) => <div key={w} className="px-2 py-2 text-center">{w}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const items = getDay(d);
          const inMonth = isSameMonth(d, cursor);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className={cn(
                "min-h-[110px] border-t border-s border-border p-1.5 text-start align-top hover:bg-muted/40 transition",
                !inMonth && "bg-muted/20 text-muted-foreground",
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs w-6 h-6 inline-flex items-center justify-center rounded-full",
                  isToday(d) && "bg-primary text-primary-foreground font-bold",
                )}>{d.getDate()}</span>
                {items.length > 0 && (
                  <span className="text-[10px] bg-accent/20 text-accent rounded-full px-1.5 py-0.5">{items.length}</span>
                )}
              </div>
              <div className="space-y-0.5">
                {items.slice(0, 3).map(a => (
                  <div key={a.id} dir="ltr" className={cn("truncate text-[10px] rounded px-1 py-0.5 border", statusColor(a.status))}>
                    {format(new Date(a.slot_at), "HH:mm")} {a.child_name}
                  </div>
                ))}
                {items.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{items.length - 3}</div>
                )}
              </div>
              {/* unused suppress */}
              <span className="hidden">{locName("")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Week grid ---------- */
const WeekGrid = ({
  weekStart, getDay, weekdays, onPickDay, locName,
}: {
  weekStart: Date;
  getDay: (d: Date) => Appointment[];
  weekdays: string[];
  onPickDay: (d: Date) => void;
  locName: (id: string) => string;
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
        {days.map((d) => {
          const items = getDay(d);
          return (
            <button
              key={d.toISOString()}
              onClick={() => onPickDay(d)}
              className="min-h-[300px] border-t border-s border-border p-2 text-start align-top hover:bg-muted/40 transition space-y-1"
            >
              {items.length === 0 && <div className="text-[11px] text-muted-foreground/70 text-center mt-4">—</div>}
              {items.map(a => (
                <div key={a.id} className={cn("rounded-md border px-1.5 py-1", statusColor(a.status))}>
                  <div dir="ltr" className="text-[11px] font-bold">{format(new Date(a.slot_at), "HH:mm")}</div>
                  <div className="text-xs font-medium truncate">{a.child_name}</div>
                  <div className="text-[10px] truncate opacity-80">{locName(a.location_id)}</div>
                </div>
              ))}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
