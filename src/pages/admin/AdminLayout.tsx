import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Users, Calendar, ClipboardList, Wallet,
  ShieldCheck, Bell, FileText, LogOut, Menu, X, Settings,
} from "lucide-react";

const NAV = [
  { to: "/admin", label: "לוח בקרה", icon: LayoutDashboard, end: true },
  { to: "/admin/patients", label: "מטופלים", icon: Users },
  { to: "/admin/calendar", label: "יומן תורים", icon: Calendar },
  { to: "/admin/treatments", label: "טיפולים", icon: ClipboardList },
  { to: "/admin/payments", label: "תשלומים", icon: Wallet },
  { to: "/admin/insurance", label: "ביטוח", icon: ShieldCheck },
  { to: "/admin/reminders", label: "תזכורות מעקב", icon: Bell },
  { to: "/admin/reports", label: "דוחות", icon: FileText },
  { to: "/admin/settings", label: "הגדרות", icon: Settings },
];

const AdminLayout = () => {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return nav("/auth");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      setIsAdmin((roles ?? []).some((r) => r.role === "admin"));
      setReady(true);
    })();
  }, [nav]);

  const signOut = async () => { await supabase.auth.signOut(); nav("/auth"); };

  if (!ready) return <div className="min-h-screen grid place-items-center font-cairo">טוען…</div>;
  if (!isAdmin) return (
    <div className="min-h-screen grid place-items-center gap-4 font-cairo p-6 text-center">
      <p className="text-muted-foreground">אין לך הרשאות ניהול. פנה למנהל המערכת.</p>
      <Button onClick={signOut} variant="outline" className="gap-2"><LogOut className="w-4 h-4" /> יציאה</Button>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background font-cairo flex">
      {/* Sidebar */}
      <aside className={`${open ? "translate-x-0" : "translate-x-full md:translate-x-0"} fixed md:static inset-y-0 right-0 z-40 w-64 bg-sidebar border-l border-sidebar-border transition-transform`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div>
            <h1 className="text-lg font-bold text-primary">אוצר פעיל</h1>
            <p className="text-xs text-muted-foreground">מערכת ניהול קליניקה</p>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`
              }
            >
              <n.icon className="w-4 h-4" />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-sidebar-border">
          <Button variant="outline" onClick={signOut} className="w-full gap-2">
            <LogOut className="w-4 h-4" /> יציאה
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
          <button className="md:hidden" onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
