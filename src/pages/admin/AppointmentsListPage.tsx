import { AppointmentsList } from "@/components/admin/AppointmentsList";

const AppointmentsListPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">רשימת תורים</h1>
      <p className="text-muted-foreground text-sm">סינון לפי ממתין לאישור / מאושר / בוטל</p>
    </div>
    <AppointmentsList />
  </div>
);

export default AppointmentsListPage;
