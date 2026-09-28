import { ManualAppointmentForm } from "@/components/admin/ManualAppointmentForm";

const NewAppointmentPage = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold">תור חדש</h1>
      <p className="text-muted-foreground text-sm">הוספת תור ידנית (מאושר מיידית)</p>
    </div>
    <ManualAppointmentForm />
  </div>
);

export default NewAppointmentPage;
