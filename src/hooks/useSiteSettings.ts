import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  phone_display: string;
  phone_tel: string;
  whatsapp_number: string;
  contact_email: string;
  experience_years: string;
}

const defaults: SiteSettings = {
  phone_display: "050-577-2680",
  phone_tel: "+972505772680",
  whatsapp_number: "972505772680",
  contact_email: "info@ot-clinic.com",
  experience_years: "10",
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaults);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (!data) return;
      const map = { ...defaults };
      for (const row of data as { key: string; value: string }[]) {
        if (row.key in map) (map as Record<string, string>)[row.key] = row.value;
      }
      setSettings(map);
    })();
  }, []);

  return settings;
};
