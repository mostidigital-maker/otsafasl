import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, startOfMonth, endOfMonth } from "date-fns";

type ReportType = "appointments" | "payments" | "treatments" | "insurance" | "patients";

const REPORT_META: Record<ReportType, { label: string; description: string }> = {
  appointments: { label: "תורים", description: "כל התורים בטווח הנבחר" },
  payments: { label: "תשלומים", description: "תשלומים ויתרות" },
  treatments: { label: "טיפולים", description: "תיעודי טיפול" },
  insurance: { label: "ביטוח", description: "הגשות לקופות" },
  patients: { label: "מטופלים", description: "פרופילי מטופלים" },
};

const ReportsPage = () => {
  const { toast } = useToast();
  const today = new Date();
  const [type, setType] = useState<ReportType>("appointments");
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const fetchData = async (): Promise<{ rows: any[]; columns: { key: string; label: string }[] }> => {
    if (type === "appointments") {
      const { data } = await supabase.from("appointments")
        .select("slot_at, status, child_name, child_national_id, parent_name, phone, notes")
        .gte("slot_at", from).lte("slot_at", to + "T23:59:59").order("slot_at");
      return {
        rows: (data ?? []).map((r: any) => ({
          תאריך: format(new Date(r.slot_at), "dd/MM/yyyy HH:mm"),
          סטטוס: r.status, "שם ילד": r.child_name, "ת.ז": r.child_national_id || "",
          הורה: r.parent_name, טלפון: r.phone, הערות: r.notes || "",
        })),
        columns: [
          { key: "תאריך", label: "תאריך" }, { key: "סטטוס", label: "סטטוס" },
          { key: "שם ילד", label: "שם ילד" }, { key: "ת.ז", label: "ת.ז" },
          { key: "הורה", label: "הורה" }, { key: "טלפון", label: "טלפון" },
        ],
      };
    }
    if (type === "payments") {
      const { data } = await supabase.from("payments")
        .select("payment_date, treatment_price, patient_paid, insurance_paid, payment_type, insurance_provider, patient:patients(full_name)")
        .is("deleted_at", null).gte("payment_date", from).lte("payment_date", to).order("payment_date");
      return {
        rows: (data ?? []).map((r: any) => ({
          תאריך: r.payment_date, מטופל: r.patient?.full_name ?? "",
          "מחיר": Number(r.treatment_price),
          "שולם מטופל": Number(r.patient_paid), "שולם ביטוח": Number(r.insurance_paid),
          יתרה: Number(r.treatment_price) - Number(r.patient_paid) - Number(r.insurance_paid),
          סוג: r.payment_type, ביטוח: r.insurance_provider || "",
        })),
        columns: [
          { key: "תאריך", label: "תאריך" }, { key: "מטופל", label: "מטופל" },
          { key: "מחיר", label: "מחיר" }, { key: "שולם מטופל", label: "שולם" },
          { key: "שולם ביטוח", label: "ביטוח" }, { key: "יתרה", label: "יתרה" },
        ],
      };
    }
    if (type === "treatments") {
      const { data } = await supabase.from("treatments")
        .select("treatment_date, summary, patient:patients(full_name)")
        .is("deleted_at", null).gte("treatment_date", from).lte("treatment_date", to).order("treatment_date");
      return {
        rows: (data ?? []).map((r: any) => ({
          תאריך: r.treatment_date, מטופל: r.patient?.full_name ?? "", סיכום: r.summary ?? "",
        })),
        columns: [
          { key: "תאריך", label: "תאריך" }, { key: "מטופל", label: "מטופל" }, { key: "סיכום", label: "סיכום" },
        ],
      };
    }
    if (type === "insurance") {
      const { data } = await supabase.from("insurance_claims")
        .select("submission_date, provider, amount, status, patient:patients(full_name)")
        .is("deleted_at", null).gte("submission_date", from).lte("submission_date", to);
      return {
        rows: (data ?? []).map((r: any) => ({
          תאריך: r.submission_date, מטופל: r.patient?.full_name ?? "",
          קופה: r.provider, סכום: Number(r.amount), סטטוס: r.status,
        })),
        columns: [
          { key: "תאריך", label: "תאריך" }, { key: "מטופל", label: "מטופל" },
          { key: "קופה", label: "קופה" }, { key: "סכום", label: "סכום" }, { key: "סטטוס", label: "סטטוס" },
        ],
      };
    }
    // patients
    const { data } = await supabase.from("patients")
      .select("full_name, national_id, phone, parent_name, date_of_birth, created_at")
      .is("deleted_at", null).order("created_at", { ascending: false });
    return {
      rows: (data ?? []).map((r: any) => ({
        "שם מלא": r.full_name, "ת.ז": r.national_id || "", טלפון: r.phone || "",
        הורה: r.parent_name || "", "תאריך לידה": r.date_of_birth || "",
        "נוצר": r.created_at?.slice(0, 10) ?? "",
      })),
      columns: [
        { key: "שם מלא", label: "שם מלא" }, { key: "ת.ז", label: "ת.ז" },
        { key: "טלפון", label: "טלפון" }, { key: "הורה", label: "הורה" },
        { key: "תאריך לידה", label: "לידה" },
      ],
    };
  };

  const exportExcel = async () => {
    setLoading(true);
    try {
      const { rows } = await fetchData();
      if (rows.length === 0) return toast({ title: "אין נתונים בטווח שנבחר" });
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, REPORT_META[type].label);
      XLSX.writeFile(wb, `${type}-${from}_${to}.xlsx`);
      toast({ title: "הקובץ הורד" });
    } finally { setLoading(false); }
  };

  const exportPDF = async () => {
    setLoading(true);
    try {
      const { rows, columns } = await fetchData();
      if (rows.length === 0) return toast({ title: "אין נתונים בטווח שנבחר" });
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text(`Otsar Faal - ${REPORT_META[type].label}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`${from}  -  ${to}`, 14, 22);
      autoTable(doc, {
        startY: 28,
        head: [columns.map((c) => c.label)],
        body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [56, 178, 172] },
      });
      doc.save(`${type}-${from}_${to}.pdf`);
      toast({ title: "הקובץ הורד" });
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">דוחות</h1>
        <p className="text-muted-foreground text-sm">הפקת דוחות Excel ו-PDF</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>סוג דוח</Label>
            <Select value={type} onValueChange={(v: ReportType) => setType(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_META).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{REPORT_META[type].description}</p>
          </div>
          <div className="space-y-2">
            <Label>מתאריך</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>עד תאריך</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={exportExcel} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            ייצוא Excel
          </Button>
          <Button onClick={exportPDF} disabled={loading} variant="outline" className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            ייצוא PDF
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
