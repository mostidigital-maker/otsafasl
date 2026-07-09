import { Card, CardContent } from "@/components/ui/card";
import type { Patient } from "@/pages/admin/PatientProfilePage";

export const InfoTab = ({ patient: p }: { patient: Patient; onSaved: () => void }) => {
  const info: { label: string; value: string | null }[] = [
    { label: "ת.ז", value: p.national_id },
    { label: "תאריך לידה", value: p.date_of_birth },
    { label: "מין", value: p.gender === "male" ? "זכר" : p.gender === "female" ? "נקבה" : p.gender },
    { label: "שם הורה", value: p.parent_name },
    { label: "טלפון", value: p.phone },
    { label: "אימייל", value: p.email },
    { label: "כתובת", value: p.address },
    { label: "איש קשר חירום", value: p.emergency_contact },
    { label: "טלפון חירום", value: p.emergency_phone },
    { label: "הערות", value: p.notes },
  ];
  return (
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
  );
};
