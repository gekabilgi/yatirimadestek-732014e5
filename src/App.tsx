
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import IncentiveTools from "./pages/IncentiveTools";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminAnalytics from "./pages/AdminAnalytics";
import QAManagement from "./pages/QAManagement";
import AdminEmailManagement from "./pages/AdminEmailManagement";
import AdminGlossaryManagement from "./pages/AdminGlossaryManagement";
import InvestorGlossary from "./pages/InvestorGlossary";
import ProgramDetails from "./pages/ProgramDetails";
import NotFound from "./pages/NotFound";
import SearchSupport from "./pages/SearchSupport";
import YdoSecureAccess from "./pages/YdoSecureAccess";
import QNA from "./pages/QNA";

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
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/incentive-tools" element={<IncentiveTools />} />
              <Route path="/qna" element={
                <ProtectedAdminRoute>
                  <QNA />
                </ProtectedAdminRoute>
              } />
              <Route path="/searchsupport" element={
                <ProtectedAdminRoute>
                  <SearchSupport />
                </ProtectedAdminRoute>
              } />
              <Route path="/investor-glossary" element={
                <ProtectedAdminRoute>
                  <InvestorGlossary />
                </ProtectedAdminRoute>
              } />
              <Route path="/ydo/secure-access" element={<YdoSecureAccess />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <Admin />
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
              <Route path="/admin/email-management" element={
                <ProtectedAdminRoute>
                  <AdminEmailManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/glossary-management" element={
                <ProtectedAdminRoute>
                  <AdminGlossaryManagement />
                </ProtectedAdminRoute>
              } />
              <Route path="/program/:id" element={<ProgramDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
