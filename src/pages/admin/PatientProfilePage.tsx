import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, User } from "lucide-react";
import { InfoTab } from "@/components/admin/patient/InfoTab";
import { TimelineTab } from "@/components/admin/patient/TimelineTab";
import { AppointmentsTab } from "@/components/admin/patient/AppointmentsTab";
import { TreatmentsTab } from "@/components/admin/patient/TreatmentsTab";
import { PaymentsTab } from "@/components/admin/patient/PaymentsTab";
import { FilesTab } from "@/components/admin/patient/FilesTab";
import { NotesTab } from "@/components/admin/patient/NotesTab";

export interface Patient {
  id: string; full_name: string; national_id: string | null; phone: string | null;
  parent_name: string | null; date_of_birth: string | null; gender: string | null;
  email: string | null; address: string | null; notes: string | null;
  emergency_contact: string | null; emergency_phone: string | null;
}

const PatientProfilePage = () => {
  const { id } = useParams();
  const [p, setP] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    if (!id) return;
    supabase.from("patients").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setP(data as Patient | null); setLoading(false);
    });
  };

  useEffect(() => { reload(); }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">טוען…</div>;
  if (!p) return (
    <div className="p-6 space-y-4">
      <p className="text-muted-foreground">המטופל לא נמצא.</p>
      <Button asChild variant="outline"><Link to="/admin/patients"><ArrowRight className="w-4 h-4 ml-2" /> חזרה לרשימה</Link></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link to="/admin/patients"><ArrowRight className="w-4 h-4" /> חזרה לרשימת המטופלים</Link>
      </Button>

      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 grid place-items-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">{p.full_name}</CardTitle>
            <p className="text-sm text-muted-foreground" dir="ltr">{p.national_id || ""}</p>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList className="flex-wrap">
          <TabsTrigger value="timeline">ציר זמן</TabsTrigger>
          <TabsTrigger value="info">פרטים אישיים</TabsTrigger>
          <TabsTrigger value="appointments">תורים</TabsTrigger>
          <TabsTrigger value="treatments">טיפולים</TabsTrigger>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="files">מסמכים</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline"><TimelineTab patientId={p.id} /></TabsContent>
        <TabsContent value="info"><InfoTab patient={p} onSaved={reload} /></TabsContent>
        <TabsContent value="appointments"><AppointmentsTab patientId={p.id} /></TabsContent>
        <TabsContent value="treatments"><TreatmentsTab patientId={p.id} /></TabsContent>
        <TabsContent value="payments"><PaymentsTab patientId={p.id} /></TabsContent>
        <TabsContent value="files"><FilesTab patientId={p.id} /></TabsContent>
        <TabsContent value="notes"><NotesTab patientId={p.id} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientProfilePage;
