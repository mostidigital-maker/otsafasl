import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, User } from "lucide-react";

interface Patient {
  id: string; full_name: string; national_id: string | null; phone: string | null;
  parent_name: string | null; date_of_birth: string | null; gender: string | null;
  email: string | null; address: string | null; notes: string | null;
}

const PatientProfilePage = () => {
  const { id } = useParams();
  const [p, setP] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("patients").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setP(data as Patient | null); setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-6 text-muted-foreground">טוען…</div>;
  if (!p) return (
    <div className="p-6 space-y-4">
      <p className="text-muted-foreground">המטופל לא נמצא.</p>
      <Button asChild variant="outline"><Link to="/admin/patients"><ArrowRight className="w-4 h-4 ml-2" /> חזרה לרשימה</Link></Button>
    </div>
  );

  const info: { label: string; value: string | null }[] = [
    { label: "ת.ז", value: p.national_id },
    { label: "תאריך לידה", value: p.date_of_birth },
    { label: "מין", value: p.gender === "male" ? "זכר" : p.gender === "female" ? "נקבה" : p.gender },
    { label: "שם הורה", value: p.parent_name },
    { label: "טלפון", value: p.phone },
    { label: "אימייל", value: p.email },
    { label: "כתובת", value: p.address },
    { label: "הערות", value: p.notes },
  ];

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

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap">
          <TabsTrigger value="info">פרטים אישיים</TabsTrigger>
          <TabsTrigger value="timeline" disabled>Timeline (בקרוב)</TabsTrigger>
          <TabsTrigger value="treatments" disabled>טיפולים (בקרוב)</TabsTrigger>
          <TabsTrigger value="payments" disabled>תשלומים (בקרוב)</TabsTrigger>
          <TabsTrigger value="files" disabled>מסמכים (בקרוב)</TabsTrigger>
          <TabsTrigger value="notes" disabled>הערות פנימיות (בקרוב)</TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <Card>
            <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
              {info.map((i) => (
                <div key={i.label} className="border-b border-border pb-2">
                  <p className="text-xs text-muted-foreground">{i.label}</p>
                  <p className="font-medium">{i.value || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientProfilePage;
