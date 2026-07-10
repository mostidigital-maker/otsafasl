import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, Wallet, Bell, TrendingUp, Activity } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid, Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface Stats {
  patients: number; todayAppts: number; upcoming: number; pendingReminders: number;
  monthIncome: number; outstanding: number;
}
interface Activity { id: string; action: string; table_name: string; created_at: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(var(--primary))",
  confirmed: "hsl(var(--accent))",
  cancelled: "hsl(var(--destructive))",
  arrived: "hsl(var(--secondary))",
  completed: "hsl(142 71% 45%)",
  no_show: "hsl(25 95% 53%)",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "ממתין", confirmed: "מאושר", cancelled: "בוטל",
  arrived: "הגיע", completed: "בוצע", no_show: "לא הגיע",
};

const DashboardPage = () => {
  const [s, setS] = useState<Stats>({
    patients: 0, todayAppts: 0, upcoming: 0, pendingReminders: 0, monthIncome: 0, outstanding: 0,
  });
  const [statusData, setStatusData] = useState<{ name: string; value: number; key: string }[]>([]);
  const [monthly, setMonthly] = useState<{ month: string; income: number }[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startDay = new Date(now); startDay.setHours(0, 0, 0, 0);
      const endDay = new Date(now); endDay.setHours(23, 59, 59, 999);
      const monthStart = startOfMonth(now);

      const [p, tApp, upApp, rem, appts, pays, log] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).is("deleted_at", null),
        supabase.from("appointments").select("id", { count: "exact", head: true })
          .gte("slot_at", startDay.toISOString()).lte("slot_at", endDay.toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gt("slot_at", endDay.toISOString()),
        supabase.from("follow_up_reminders").select("id", { count: "exact", head: true })
          .eq("status", "pending").is("deleted_at", null),
        supabase.from("appointments").select("status"),
        supabase.from("payments").select("payment_date, treatment_price, patient_paid, insurance_paid")
          .is("deleted_at", null).gte("payment_date", subMonths(monthStart, 5).toISOString().slice(0, 10)),
        supabase.from("audit_log").select("id, action, table_name, created_at")
          .order("created_at", { ascending: false }).limit(8),
      ]);

      // Status distribution
      const counts: Record<string, number> = {};
      (appts.data ?? []).forEach((a: any) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
      setStatusData(Object.entries(counts).map(([k, v]) => ({ key: k, name: STATUS_LABELS[k] ?? k, value: v })));

      // Monthly income (last 6 months)
      const buckets: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        buckets[format(d, "yyyy-MM")] = 0;
      }
      let monthIncome = 0;
      let outstanding = 0;
      (pays.data ?? []).forEach((r: any) => {
        const key = r.payment_date?.slice(0, 7);
        const paid = Number(r.patient_paid || 0) + Number(r.insurance_paid || 0);
        const bal = Number(r.treatment_price || 0) - paid;
        if (key && key in buckets) buckets[key] += paid;
        if (r.payment_date >= format(monthStart, "yyyy-MM-dd")) monthIncome += paid;
        if (bal > 0) outstanding += bal;
      });
      setMonthly(Object.entries(buckets).map(([k, v]) => ({
        month: format(new Date(k + "-01"), "MMM"),
        income: v,
      })));

      setS({
        patients: p.count ?? 0,
        todayAppts: tApp.count ?? 0,
        upcoming: upApp.count ?? 0,
        pendingReminders: rem.count ?? 0,
        monthIncome, outstanding,
      });
      setActivity((log.data ?? []) as Activity[]);
    })();
  }, []);

  const cards = [
    { label: "מטופלים פעילים", value: s.patients, icon: Users, color: "text-primary", to: "/admin/patients" },
    { label: "תורים היום", value: s.todayAppts, icon: Calendar, color: "text-accent", to: "/admin/calendar" },
    { label: "תורים עתידיים", value: s.upcoming, icon: Calendar, color: "text-secondary", to: "/admin/calendar" },
    { label: "תזכורות ממתינות", value: s.pendingReminders, icon: Bell, color: "text-secondary", to: "/admin/reminders" },
    { label: "הכנסות החודש", value: `₪${s.monthIncome.toLocaleString()}`, icon: TrendingUp, color: "text-primary", to: "/admin/payments" },
    { label: "יתרות פתוחות", value: `₪${s.outstanding.toLocaleString()}`, icon: Wallet, color: "text-destructive", to: "/admin/payments" },
  ];

  const actionLabel = (a: string) =>
    a === "INSERT" ? "נוסף" : a === "UPDATE" ? "עודכן" : a === "DELETE" ? "נמחק" : a;
  const tableLabel = (t: string) => ({
    patients: "מטופל", appointments: "תור", treatments: "טיפול",
    payments: "תשלום", follow_up_reminders: "תזכורת", internal_notes: "הערה", patient_files: "מסמך",
  }[t] ?? t);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">לוח בקרה</h1>
        <p className="text-muted-foreground text-sm">סקירה כללית של הקליניקה</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="shadow-soft hover:shadow-md transition h-full">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{c.value}</div></CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">הכנסות – 6 חודשים אחרונים</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => `₪${v.toLocaleString()}`} />
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">התפלגות סטטוס תורים</CardTitle></CardHeader>
          <CardContent className="h-64">
            {statusData.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm mt-16">אין נתונים</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {statusData.map((e) => (
                      <Cell key={e.key} fill={STATUS_COLORS[e.key] ?? "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Activity className="w-4 h-4 text-primary" />
          <CardTitle className="text-base">פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.length === 0 && <p className="text-sm text-muted-foreground">אין פעילות להצגה</p>}
          <ul className="divide-y divide-border">
            {activity.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between text-sm">
                <span>{tableLabel(a.table_name)} {actionLabel(a.action)}</span>
                <span dir="ltr" className="text-xs text-muted-foreground">
                  {format(new Date(a.created_at), "dd/MM HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
