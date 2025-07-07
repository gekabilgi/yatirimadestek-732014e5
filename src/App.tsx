
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import IncentiveTools from '@/pages/IncentiveTools';
import SearchSupport from '@/pages/SearchSupport';
import ProgramDetails from '@/pages/ProgramDetails';
import InvestmentOpportunities from '@/pages/InvestmentOpportunities';
import FeasibilityStatistics from '@/pages/FeasibilityStatistics';
import InvestorGlossary from '@/pages/InvestorGlossary';
import QNA from '@/pages/QNA';
import AdminLogin from '@/pages/AdminLogin';
import Admin from '@/pages/Admin';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import AdminSupportPrograms from '@/pages/AdminSupportPrograms';
import AdminFeasibilityReports from '@/pages/AdminFeasibilityReports';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminEmailManagement from '@/pages/AdminEmailManagement';
import AdminGlossaryManagement from '@/pages/AdminGlossaryManagement';
import QAManagement from '@/pages/QAManagement';
import YdoSecureAccess from '@/pages/YdoSecureAccess';
import TedarikZinciriOnTalepGirisi from '@/pages/TedarikZinciriOnTalepGirisi';
import TedarikZinciriOnTalepBasarili from '@/pages/TedarikZinciriOnTalepBasarili';
import TedarikZinciriOnTalepHata from '@/pages/TedarikZinciriOnTalepHata';
import AdminTZOnTalepListesi from '@/pages/AdminTZOnTalepListesi';
import NotFound from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tesvik-araclari" element={<IncentiveTools />} />
            <Route path="/destek-ara" element={<SearchSupport />} />
            <Route path="/program/:id" element={<ProgramDetails />} />
            <Route path="/yatirim-firsatlari" element={<InvestmentOpportunities />} />
            <Route path="/fizibilite-istatistikleri" element={<FeasibilityStatistics />} />
            <Route path="/yatirimci-sozlugu" element={<InvestorGlossary />} />
            <Route path="/soru-cevap" element={<QNA />} />
            <Route path="/tedarik-zinciri-yerlilestirme-on-talep-girisi" element={<TedarikZinciriOnTalepGirisi />} />
            <Route path="/tedarik-zinciri-yerlilestirme-on-talep-basarili" element={<TedarikZinciriOnTalepBasarili />} />
            <Route path="/tedarik-zinciri-yerlilestirme-on-talep-hata" element={<TedarikZinciriOnTalepHata />} />
            
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/support-programs"
              element={
                <ProtectedAdminRoute>
                  <AdminSupportPrograms />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/feasibility-reports"
              element={
                <ProtectedAdminRoute>
                  <AdminFeasibilityReports />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedAdminRoute>
                  <AdminAnalytics />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/email-management"
              element={
                <ProtectedAdminRoute>
                  <AdminEmailManagement />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/glossary-management"
              element={
                <ProtectedAdminRoute>
                  <AdminGlossaryManagement />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/qa-management"
              element={
                <ProtectedAdminRoute>
                  <QAManagement />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/tzontaleplistesi"
              element={
                <ProtectedAdminRoute>
                  <AdminTZOnTalepListesi />
                </ProtectedAdminRoute>
              }
            />
            <Route path="/ydo-secure-access" element={<YdoSecureAccess />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
