import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentsList } from "@/components/admin/AppointmentsList";
import { AppointmentsCalendar } from "@/components/admin/AppointmentsCalendar";
import { WorkingHoursManager } from "@/components/admin/WorkingHoursManager";
import { BlockedSlotsManager } from "@/components/admin/BlockedSlotsManager";
import { ManualAppointmentForm } from "@/components/admin/ManualAppointmentForm";
import { LanguageSwitcher } from "@/components/landing/LanguageSwitcher";

const Admin = () => {
  const { t } = useLanguage();
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav("/auth"); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const admin = (roles ?? []).some((r) => r.role === "admin");
      setIsAdmin(admin);
      setReady(true);
    })();
  }, [nav]);

  const signOut = async () => {
    await supabase.auth.signOut();
    nav("/auth");
  };

  if (!ready) return <div className="min-h-screen flex items-center justify-center font-cairo">...</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4 font-cairo">
        <p className="text-muted-foreground text-center max-w-md">
          هذا الحساب ليس لديه صلاحيات الإدارة. تواصل مع مزود الخدمة لمنحك صلاحية admin.
        </p>
        <Button onClick={signOut} variant="outline" className="gap-2"><LogOut className="w-4 h-4" /> {t.admin.signOut}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-cairo">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">{t.admin.title}</h1>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
              <LogOut className="w-4 h-4" /> {t.admin.signOut}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="calendar">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="calendar">{t.admin.tabs.calendar}</TabsTrigger>
            <TabsTrigger value="appointments">{t.admin.tabs.appointments}</TabsTrigger>
            <TabsTrigger value="manual">{t.admin.tabs.manual}</TabsTrigger>
            <TabsTrigger value="workingHours">{t.admin.tabs.workingHours}</TabsTrigger>
            <TabsTrigger value="blocked">{t.admin.tabs.blocked}</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar"><AppointmentsCalendar /></TabsContent>
          <TabsContent value="appointments"><AppointmentsList /></TabsContent>
          <TabsContent value="manual"><ManualAppointmentForm /></TabsContent>
          <TabsContent value="workingHours"><WorkingHoursManager /></TabsContent>
          <TabsContent value="blocked"><BlockedSlotsManager /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
