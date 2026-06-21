import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WorkingHour {
  id: string;
  location_id: string;
  weekday: number;
  opens_at: string; // "09:00:00"
  closes_at: string;
  slot_minutes: number;
}

export interface BlockedSlot {
  id: string;
  location_id: string;
  start_at: string;
  end_at: string;
}

export interface TakenSlot {
  location_id: string;
  slot_at: string;
  duration_minutes: number;
}

export interface SlotOption {
  iso: string; // ISO string for the slot start
  label: string; // HH:MM display
}

function parseTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return { h, m };
}

/** Compute available slots for a given date+location based on working hours,
 *  blocked slots and taken appointments. */
export function computeSlots(
  date: Date,
  locationId: string,
  workingHours: WorkingHour[],
  blocked: BlockedSlot[],
  taken: TakenSlot[],
): SlotOption[] {
  const weekday = date.getDay();
  const dayHours = workingHours.filter(
    (w) => w.location_id === locationId && w.weekday === weekday,
  );
  if (dayHours.length === 0) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const slots: SlotOption[] = [];
  const now = Date.now();

  for (const wh of dayHours) {
    const open = parseTime(wh.opens_at);
    const close = parseTime(wh.closes_at);
    const start = new Date(dayStart);
    start.setHours(open.h, open.m, 0, 0);
    const end = new Date(dayStart);
    end.setHours(close.h, close.m, 0, 0);
    const slotMs = wh.slot_minutes * 60 * 1000;

    for (let t = start.getTime(); t + slotMs <= end.getTime(); t += slotMs) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t + slotMs);
      if (slotStart.getTime() <= now + 60 * 60 * 1000) continue; // 1h ahead minimum

      // Blocked?
      const isBlocked = blocked.some(
        (b) =>
          b.location_id === locationId &&
          new Date(b.start_at) < slotEnd &&
          new Date(b.end_at) > slotStart,
      );
      if (isBlocked) continue;

      // Taken?
      const isTaken = taken.some(
        (a) =>
          a.location_id === locationId &&
          Math.abs(new Date(a.slot_at).getTime() - slotStart.getTime()) < 1000,
      );
      if (isTaken) continue;

      slots.push({
        iso: slotStart.toISOString(),
        label: `${String(slotStart.getHours()).padStart(2, "0")}:${String(
          slotStart.getMinutes(),
        ).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}

export function useAvailability(locationId: string | null) {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [taken, setTaken] = useState<TakenSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    const now = new Date();
    const horizon = new Date();
    horizon.setMonth(horizon.getMonth() + 1);

    (async () => {
      const [wh, bl, tk] = await Promise.all([
        supabase.from("working_hours").select("*").eq("location_id", locationId).eq("is_active", true),
        supabase.from("blocked_slots").select("*").eq("location_id", locationId).gte("end_at", now.toISOString()),
        supabase.from("taken_slots").select("*").eq("location_id", locationId).gte("slot_at", now.toISOString()).lte("slot_at", horizon.toISOString()),
      ]);
      if (wh.data) setWorkingHours(wh.data as WorkingHour[]);
      if (bl.data) setBlocked(bl.data as BlockedSlot[]);
      if (tk.data) setTaken(tk.data as TakenSlot[]);
      setLoading(false);
    })();
  }, [locationId]);

  return { workingHours, blocked, taken, loading };
}

/** Days within the next month that have at least one available slot. */
export function getAvailableDates(
  locationId: string | null,
  workingHours: WorkingHour[],
  blocked: BlockedSlot[],
  taken: TakenSlot[],
): Set<string> {
  if (!locationId) return new Set();
  const dates = new Set<string>();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 31; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const slots = computeSlots(d, locationId, workingHours, blocked, taken);
    if (slots.length > 0) dates.add(d.toDateString());
  }
  return dates;
}
