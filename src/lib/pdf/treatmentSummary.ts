import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface TreatmentFull {
  treatment_date: string;
  summary?: string | null; assessment?: string | null; goals?: string | null;
  activities?: string | null; patient_response?: string | null; progress?: string | null;
  recommendations?: string | null; home_exercises?: string | null; next_plan?: string | null;
  requires_follow_up?: boolean; follow_up_date?: string | null; follow_up_priority?: string | null;
}

export const generateTreatmentPDF = (patientName: string, t: TreatmentFull) => {
  const doc = new jsPDF();
  const today = format(new Date(), "dd/MM/yyyy");
  doc.setFontSize(18);
  doc.text("Otsar Faal - Treatment Summary", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Patient: ${patientName}`, 14, 25);
  doc.text(`Treatment Date: ${format(new Date(t.treatment_date), "dd/MM/yyyy")}`, 14, 31);
  doc.text(`Generated: ${today}`, 196, 25, { align: "right" });

  const rows: [string, string][] = [
    ["Summary", t.summary || "-"],
    ["Assessment", t.assessment || "-"],
    ["Goals", t.goals || "-"],
    ["Activities", t.activities || "-"],
    ["Patient Response", t.patient_response || "-"],
    ["Progress", t.progress || "-"],
    ["Recommendations", t.recommendations || "-"],
    ["Home Exercises", t.home_exercises || "-"],
    ["Next Plan", t.next_plan || "-"],
  ];
  if (t.requires_follow_up) {
    rows.push(["Follow-up",
      `${t.follow_up_date ? format(new Date(t.follow_up_date), "dd/MM/yyyy") : "-"} (${t.follow_up_priority || "medium"})`]);
  }
  autoTable(doc, {
    startY: 38, theme: "grid",
    head: [["Field", "Details"]],
    body: rows,
    styles: { fontSize: 9, cellWidth: "wrap" },
    columnStyles: { 0: { cellWidth: 45, fontStyle: "bold" }, 1: { cellWidth: 140 } },
  });

  doc.save(`treatment-${patientName}-${format(new Date(t.treatment_date), "yyyy-MM-dd")}.pdf`);
};
