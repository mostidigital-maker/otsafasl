import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MapPin } from "lucide-react";

interface Loc {
  id: string;
  name_he: string;
  name_ar: string;
  name_en: string;
  address_he: string | null;
  is_active: boolean;
}

export const LocationsManager = () => {
  const { toast } = useToast();
  const [locs, setLocs] = useState<Loc[]>([]);

  const load = async () => {
    const { data } = await supabase.from("locations").select("*").order("sort_order");
    setLocs((data ?? []) as Loc[]);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (l: Loc) => {
    const { error } = await supabase.from("locations").update({ is_active: !l.is_active }).eq("id", l.id);
    if (error) return toast({ title: "שגיאה", description: error.message, variant: "destructive" });
    toast({ title: !l.is_active ? "המקום נפתח לקביעת תורים" : "המקום נסגר לקביעת תורים" });
    load();
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        סגירת מקום מסתירה אותו מטופס קביעת התורים באתר ומשעות הפעילות המוצגות בדף הראשי.
      </p>
      {locs.map((l) => (
        <div key={l.id} className="flex items-center gap-3 border rounded-lg p-3">
          <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{l.name_he}</div>
            <div className="text-xs text-muted-foreground">{l.address_he || l.name_ar}</div>
          </div>
          <Badge variant={l.is_active ? "default" : "secondary"}>{l.is_active ? "פתוח" : "סגור"}</Badge>
          <Switch checked={l.is_active} onCheckedChange={() => toggle(l)} />
        </div>
      ))}
      {locs.length === 0 && <p className="text-sm text-muted-foreground">אין מקומות מוגדרים.</p>}
    </div>
  );
};
