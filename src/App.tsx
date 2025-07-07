import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthContextProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import InvestmentOpportunities from "./pages/InvestmentOpportunities";
import NotFound from "./pages/NotFound";

// Import all the pages
import IncentiveTools from "./pages/IncentiveTools";
import SearchSupport from "./pages/SearchSupport";
import FeasibilityStatistics from "./pages/FeasibilityStatistics";
import InvestorGlossary from "./pages/InvestorGlossary";
import QNA from "./pages/QNA";
import ProgramDetails from "./pages/ProgramDetails";

// Admin pages
import AdminLogin from "./pages/AdminLogin";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import Admin from "./pages/Admin";
import AdminSupportPrograms from "./pages/AdminSupportPrograms";
import AdminFeasibilityReports from "./pages/AdminFeasibilityReports";
import AdminGlossaryManagement from "./pages/AdminGlossaryManagement";
import QAManagement from "./pages/QAManagement";
import AdminEmailManagement from "./pages/AdminEmailManagement";
import AdminAnalytics from "./pages/AdminAnalytics";
import YdoSecureAccess from "./pages/YdoSecureAccess";

// Tedarik Zinciri pages
import TedarikZinciriOnTalepGirisi from "./pages/TedarikZinciriOnTalepGirisi";
import TedarikZinciriOnTalepBasarili from "./pages/TedarikZinciriOnTalepBasarili";
import TedarikZinciriOnTalepHata from "./pages/TedarikZinciriOnTalepHata";
import TedarikZinciriIlanListesi from "./pages/TedarikZinciriIlanListesi";
import TedarikZinciriFirmaDetay from "./pages/TedarikZinciriFirmaDetay";

// Admin Tedarik Zinciri pages
import AdminTZOnTalepListesi from "./pages/AdminTZOnTalepListesi";
import AdminTZOnTalepDuzenle from "./pages/AdminTZOnTalepDuzenle";
import AdminTZUrunIlanEkle from "./pages/AdminTZUrunIlanEkle";
import AdminTZUrunTalepListesi from "./pages/AdminTZUrunTalepListesi";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthContextProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/yatirim-firsatlari" element={<InvestmentOpportunities />} />
            <Route path="/tesvik-araclari" element={<IncentiveTools />} />
            <Route path="/destek-ara" element={<SearchSupport />} />
            <Route path="/fizibilite-istatistikleri" element={<FeasibilityStatistics />} />
            <Route path="/yatirimci-sozlugu" element={<InvestorGlossary />} />
            <Route path="/soru-cevap" element={<QNA />} />
            <Route path="/program/:id" element={<ProgramDetails />} />
            
            {/* Tedarik Zinciri Public Routes */}
            <Route path="/tedarik-zinciri-yerlilestirme-on-talep-girisi" element={<TedarikZinciriOnTalepGirisi />} />
            <Route path="/tedarik-zinciri-yerlilestirme-on-talep-basarili" element={<TedarikZinciriOnTalepBasarili />} />
            <Route path="/tedarik-zinciri-yerlilestirme-on-talep-hata" element={<TedarikZinciriOnTalepHata />} />
            <Route path="/tedarik-zinciri-yerlilestirme-ilanlistesi" element={<TedarikZinciriIlanListesi />} />
            <Route path="/tedarik-zinciri-yerlilestirme-ttl-:vkn" element={<TedarikZinciriFirmaDetay />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/ydo-secure-access" element={<YdoSecureAccess />} />
            
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/destek-programlari" element={
              <ProtectedAdminRoute>
                <AdminSupportPrograms />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/fizibilite-raporlari" element={
              <ProtectedAdminRoute>
                <AdminFeasibilityReports />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/yatirimci-sozlugu" element={
              <ProtectedAdminRoute>
                <AdminGlossaryManagement />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/soru-cevap" element={
              <ProtectedAdminRoute>
                <QAManagement />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/e-posta-yonetimi" element={
              <ProtectedAdminRoute>
                <AdminEmailManagement />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/analitik" element={
              <ProtectedAdminRoute>
                <AdminAnalytics />
              </ProtectedAdminRoute>
            } />
            
            {/* Admin Tedarik Zinciri Routes */}
            <Route path="/admin/tzontaleplistesi" element={
              <ProtectedAdminRoute>
                <AdminTZOnTalepListesi />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/tzontalepduzenle-:vkn" element={
              <ProtectedAdminRoute>
                <AdminTZOnTalepDuzenle />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/tzurunilanekle-:vkn" element={
              <ProtectedAdminRoute>
                <AdminTZUrunIlanEkle />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/tzurunilanekle-:vkn/:productId" element={
              <ProtectedAdminRoute>
                <AdminTZUrunIlanEkle />
              </ProtectedAdminRoute>
            } />
            
            <Route path="/admin/tzuruntaleplistesi" element={
              <ProtectedAdminRoute>
                <AdminTZUrunTalepListesi />
              </ProtectedAdminRoute>
            } />

            {/* Catch-all route - keep this at the end */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthContextProvider>
  </QueryClientProvider>
);

export default App;
