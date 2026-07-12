import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface Patient {
  full_name: string;
  national_id?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  parent_name?: string | null;
}
interface Treatment {
  treatment_date: string;
  summary?: string | null;
  progress?: string | null;
  next_plan?: string | null;
}
interface Appt { slot_at: string; status: string; child_name: string }
interface Payment { payment_date: string; amount: number; paid_amount: number; payment_type: string }

export const generatePatientHistoryPDF = (
  patient: Patient,
  treatments: Treatment[],
  appointments: Appt[],
  payments: Payment[]
) => {
  const doc = new jsPDF();
  const today = format(new Date(), "dd/MM/yyyy");

  doc.setFontSize(18);
  doc.text("Otsar Faal - Clinic Report", 105, 15, { align: "center" });
  doc.setFontSize(10);
  doc.text(`Generated: ${today}`, 105, 22, { align: "center" });

  doc.setFontSize(12);
  doc.text("Patient Information", 14, 32);
  autoTable(doc, {
    startY: 35,
    theme: "grid",
    head: [["Field", "Value"]],
    body: [
      ["Name", patient.full_name],
      ["National ID", patient.national_id || "-"],
      ["Date of Birth", patient.date_of_birth ? format(new Date(patient.date_of_birth), "dd/MM/yyyy") : "-"],
      ["Phone", patient.phone || "-"],
      ["Parent", patient.parent_name || "-"],
    ],
  });

  let y = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Appointments (${appointments.length})`, 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["Date", "Status"]],
    body: appointments.map(a => [format(new Date(a.slot_at), "dd/MM/yyyy HH:mm"), a.status]),
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Treatments (${treatments.length})`, 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["Date", "Summary", "Progress", "Next Plan"]],
    body: treatments.map(t => [
      format(new Date(t.treatment_date), "dd/MM/yyyy"),
      t.summary || "-", t.progress || "-", t.next_plan || "-",
    ]),
    styles: { fontSize: 8, cellWidth: "wrap" },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Payments (${payments.length})`, 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [["Date", "Type", "Amount", "Paid"]],
    body: payments.map(p => [
      format(new Date(p.payment_date), "dd/MM/yyyy"),
      p.payment_type, p.amount.toFixed(2), p.paid_amount.toFixed(2),
    ]),
  });

  doc.save(`patient-${patient.full_name}-${today}.pdf`);
};
