
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import ProtectedMenuRoute from "@/components/ProtectedMenuRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import SkipLinks from "@/components/SkipLinks";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import Index from "./pages/Index";
import Start from "./pages/Start";
import IncentiveTools from "./pages/IncentiveTools";
import InvestmentOpportunities from "./pages/InvestmentOpportunities";
import Admin from "./pages/Admin";
import AdminSupportPrograms from "./pages/AdminSupportPrograms";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AnnouncementDetail from "./pages/AnnouncementDetail";
import AdminFeasibilityReports from "./pages/AdminFeasibilityReports";
import FeasibilityStatistics from "./pages/FeasibilityStatistics";
import AdminLogin from "./pages/AdminLogin";
import AdminAnalytics from "./pages/AdminAnalytics";
import QAManagement from "./pages/QAManagement";
import AdminEmailManagement from "./pages/AdminEmailManagement";
import AdminUserManagement from "./pages/AdminUserManagement";
import AdminGlossaryManagement from "./pages/AdminGlossaryManagement";
import AdminIncentiveSettings from "./pages/AdminIncentiveSettings";
import AdminMenuSettings from "./pages/AdminMenuSettings";
import InvestorGlossary from "./pages/InvestorGlossary";
import ApplicationProcess from "./pages/ApplicationProcess";
import ProgramDetails from "./pages/ProgramDetails";
import NotFound from "./pages/NotFound";
import SearchSupport from "./pages/SearchSupport";
import YdoSecureAccess from "./pages/YdoSecureAccess";
import QNA from "./pages/QNA";
import TZY from "./pages/TZY";
import TZYPublicList from "./pages/TZYPublicList";
import TZYOTG from "./pages/TZYOTG";
import TZYOTGBasarili from "./pages/TZYOTGBasarili";
import TZYOTGBasarisiz from "./pages/TZYOTGBasarisiz";
import TZYKayitliTalepler from "./pages/TZYKayitliTalepler";
import TZYPreRequestList from "./pages/admin/TZYPreRequestList";
import TZYCompanyEdit from "./pages/admin/TZYCompanyEdit";
import TZYProductAdd from "./pages/admin/TZYProductAdd";
import TZYProductList from "./pages/admin/TZYProductList";
import TZYEmailLogs from "./pages/admin/TZYEmailLogs";
import TZYTalepler from "./pages/TZYTalepler";
import TZYSupplierApplication from "./pages/TZYSupplierApplication";
import TZYSupplierApplicationSuccess from "./pages/TZYSupplierApplicationSuccess";
import TZYSupplierApplicationError from "./pages/TZYSupplierApplicationError";
import TZYSupplierApplications from "./pages/admin/TZYSupplierApplications";
import Legislation from "./pages/Legislation";
import AdminLegislation from "./pages/AdminLegislation";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import Chat from "./pages/Chat";
import UserProfile from "./pages/UserProfile";
import { AIChatbot } from "./components/AIChatbot";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SkipLinks />
                <ScrollToTop />
                <AccessibilityWidget />
                <AIChatbot />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/start" element={<Start />} />
          <Route path="/duyuru/:id" element={<AnnouncementDetail />} />
          <Route path="/incentive-tools" element={
            <ProtectedMenuRoute settingKey="menu_item_tesvik_araclari">
              <IncentiveTools />
            </ProtectedMenuRoute>
          } />
              <Route path="/yatirim-firsatlari" element={
                <ProtectedMenuRoute settingKey="menu_item_yatirim_firsatlari">
                  <InvestmentOpportunities />
                </ProtectedMenuRoute>
              } />
              <Route path="/tzy" element={
                <ProtectedMenuRoute settingKey="menu_item_tedarik_zinciri">
                  <TZY />
                </ProtectedMenuRoute>
              } />
              <Route path="/tzyil" element={<TZYPublicList />} />
              <Route path="/tzyotg" element={<TZYOTG />} />
              <Route path="/tzy/otg/basarili" element={<TZYOTGBasarili />} />
              <Route path="/tzy/otg/basarisiz" element={<TZYOTGBasarisiz />} />
              <Route path="/tzy/kayitli-talepler" element={<TZYKayitliTalepler />} />
              <Route path="/tzy/talepler/:on_request_id" element={<TZYTalepler />} />
              <Route path="/tzy/talepler/basvuru/:on_request_id/:product_id" element={<TZYSupplierApplication />} />
              <Route path="/tzy/supplier-application/success" element={<TZYSupplierApplicationSuccess />} />
              <Route path="/tzy/supplier-application/error" element={<TZYSupplierApplicationError />} />
              <Route path="/basvuru-sureci" element={
                <ProtectedMenuRoute settingKey="menu_item_basvuru_sureci">
                  <ApplicationProcess />
                </ProtectedMenuRoute>
              } />
              <Route path="/chat" element={
                <ProtectedMenuRoute settingKey="menu_item_chat">
                  <Chat />
                </ProtectedMenuRoute>
              } />
              <Route path="/qna" element={
                <ProtectedMenuRoute settingKey="menu_item_soru_cevap">
                  <QNA />
                </ProtectedMenuRoute>
              } />
              <Route path="/searchsupport" element={
                <ProtectedMenuRoute settingKey="menu_item_destek_arama">
                  <SearchSupport />
                </ProtectedMenuRoute>
              } />
              <Route path="/investor-glossary" element={
                <ProtectedMenuRoute settingKey="menu_item_yatirimci_sozlugu">
                  <InvestorGlossary />
                </ProtectedMenuRoute>
              } />
              <Route path="/ydo/secure-access" element={<YdoSecureAccess />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/support-programs" element={
                <ProtectedAdminRoute>
                  <AdminSupportPrograms />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/announcements" element={
                <ProtectedAdminRoute>
                  <AdminAnnouncements />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/feasibility-reports" element={
                <ProtectedAdminRoute>
                  <AdminFeasibilityReports />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/feasibility-statistics" element={
                <ProtectedAdminRoute>
                  <FeasibilityStatistics />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedAdminRoute>
                  <AdminAnalytics />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/qa-management" element={
                <ProtectedAdminRoute>
                  <QAManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/user-management" element={
                <ProtectedAdminRoute>
                  <AdminUserManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/email-management" element={
                <ProtectedAdminRoute>
                  <AdminEmailManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/profile" element={
                <ProtectedAdminRoute>
                  <UserProfile />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/glossary-management" element={
                <ProtectedAdminRoute>
                  <AdminGlossaryManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/settings/incentive-calculation" element={
                <ProtectedAdminRoute>
                  <AdminIncentiveSettings />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/settings/menu-visibility" element={
                <ProtectedAdminRoute>
                  <AdminMenuSettings />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/tzyotl" element={
                <ProtectedAdminRoute>
                  <TZYPreRequestList />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/tzy-company-edit/:taxId" element={
                <ProtectedAdminRoute>
                  <TZYCompanyEdit />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/tzyue/:taxId" element={
                <ProtectedAdminRoute>
                  <TZYProductAdd />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/tzyutl" element={
                <ProtectedAdminRoute>
                  <TZYProductList />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/tzy-email-logs" element={
                <ProtectedAdminRoute>
                  <TZYEmailLogs />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/tzy-supplier-applications" element={
                <ProtectedAdminRoute>
                  <TZYSupplierApplications />
                </ProtectedAdminRoute>
              } />
              <Route path="/mevzuat" element={<Legislation />} />
              <Route path="/admin/legislation" element={
                <ProtectedAdminRoute>
                  <AdminLegislation />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/knowledge-base" element={
                <ProtectedAdminRoute>
                  <AdminKnowledgeBase />
                </ProtectedAdminRoute>
              } />
              <Route path="/program/:id" element={<ProgramDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
