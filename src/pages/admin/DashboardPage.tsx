import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Wallet, Bell } from "lucide-react";

interface Stats { patients: number; todayAppts: number; upcoming: number; pendingReminders: number; }

const DashboardPage = () => {
  const [s, setS] = useState<Stats>({ patients: 0, todayAppts: 0, upcoming: 0, pendingReminders: 0 });

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startDay = new Date(now); startDay.setHours(0,0,0,0);
      const endDay = new Date(now); endDay.setHours(23,59,59,999);

      const [p, tApp, upApp, rem] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("slot_at", startDay.toISOString()).lte("slot_at", endDay.toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gt("slot_at", endDay.toISOString()),
        supabase.from("follow_up_reminders").select("id", { count: "exact", head: true })
          .eq("status", "pending").is("deleted_at", null),
      ]);
      setS({
        patients: p.count ?? 0,
        todayAppts: tApp.count ?? 0,
        upcoming: upApp.count ?? 0,
        pendingReminders: rem.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "מטופלים פעילים", value: s.patients, icon: Users, color: "text-primary" },
    { label: "תורים היום", value: s.todayAppts, icon: Calendar, color: "text-accent" },
    { label: "תורים עתידיים", value: s.upcoming, icon: Calendar, color: "text-secondary" },
    { label: "תזכורות ממתינות", value: s.pendingReminders, icon: Bell, color: "text-secondary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        <p className="text-muted-foreground text-sm">סקירה כללית של הקליניקה</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-soft">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`w-5 h-5 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>ברוך הבא</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          זה השלב הראשון של המערכת. המודולים המלאים (טיפולים, תשלומים, ביטוח, דוחות, PDF) ייבנו בשלבים הבאים.
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
