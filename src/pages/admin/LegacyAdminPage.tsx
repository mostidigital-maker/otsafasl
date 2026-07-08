import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppointmentsList } from "@/components/admin/AppointmentsList";
import { AppointmentsCalendar } from "@/components/admin/AppointmentsCalendar";
import { WorkingHoursManager } from "@/components/admin/WorkingHoursManager";
import { BlockedSlotsManager } from "@/components/admin/BlockedSlotsManager";
import { ManualAppointmentForm } from "@/components/admin/ManualAppointmentForm";
import { useLanguage } from "@/contexts/LanguageContext";

const LegacyAdminPage = () => {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">ניהול תורים</h1>
        <p className="text-sm text-muted-foreground">מערכת התורים המקורית</p>
      </div>
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
    </div>
  );
};

export default LegacyAdminPage;
