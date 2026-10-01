import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps admin data live without a manual page refresh:
 * realtime DB events (when enabled), periodic polling, and refetch on tab focus.
 */
export function useLiveRefresh(tables: string[], refresh: () => unknown, intervalMs = 15000) {
  const cb = useRef(refresh);
  cb.current = refresh;
  const key = tables.join(",");

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        if (document.visibilityState === "visible") cb.current();
      }, 400);
    };
    const channel = supabase.channel(`live-${key}-${Math.random().toString(36).slice(2)}`);
    tables.forEach((table) =>
      channel.on("postgres_changes" as any, { event: "*", schema: "public", table }, run),
    );
    channel.subscribe();
    const iv = setInterval(run, intervalMs);
    const onVis = () => document.visibilityState === "visible" && run();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", run);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", run);
      supabase.removeChannel(channel);
    };
  }, [key, intervalMs]);
}
