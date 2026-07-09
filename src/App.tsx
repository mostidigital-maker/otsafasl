import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import PatientsPage from "./pages/admin/PatientsPage";
import PatientProfilePage from "./pages/admin/PatientProfilePage";
import LegacyAdminPage from "./pages/admin/LegacyAdminPage";
import RemindersPage from "./pages/admin/RemindersPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import InsurancePage from "./pages/admin/InsurancePage";
import Placeholder from "./pages/admin/Placeholder";
import { LanguageProvider } from "@/contexts/LanguageContext";

const queryClient = new QueryClient();

const VercelRouteRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const route = new URLSearchParams(location.search).get("route");
    if (route === "/auth" || route === "/admin") {
      navigate(route, { replace: true });
    }
  }, [location.search, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <VercelRouteRedirect />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="patients" element={<PatientsPage />} />
              <Route path="patients/:id" element={<PatientProfilePage />} />
              <Route path="calendar" element={<LegacyAdminPage />} />
              <Route path="treatments" element={<Placeholder title="טיפולים" description="ניהול טיפולים מתוך פרופיל המטופל" />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="insurance" element={<InsurancePage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="reports" element={<Placeholder title="דוחות" description="הפקת דוחות ו-Excel/PDF" />} />
              <Route path="settings" element={<Placeholder title="הגדרות" />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
