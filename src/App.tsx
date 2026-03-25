import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { NavigationBlockerProvider } from "@/contexts/NavigationBlockerContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import StrategyAssistant from "./pages/StrategyAssistant";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import DebtEliminator from "./pages/DebtEliminator";
import Assessments from "./pages/Assessments";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import CompletePhone from "./pages/CompletePhone";
import Wizard from "./pages/Wizard";
import CompanyDashboard from "./pages/CompanyDashboard";
import NotFound from "./pages/NotFound";
import Join from "./pages/Join";
import { WizardGuard } from "@/components/auth/WizardGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NavigationBlockerProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/wizard" element={<ProtectedRoute><Wizard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><WizardGuard><Dashboard /></WizardGuard></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/assessment/edit/:id" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><WizardGuard><Results /></WizardGuard></ProtectedRoute>} />
          <Route path="/strategy-assistant" element={<ProtectedRoute><WizardGuard><StrategyAssistant /></WizardGuard></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute><WizardGuard><Plans /></WizardGuard></ProtectedRoute>} />
          <Route path="/plans/:id" element={<ProtectedRoute><WizardGuard><PlanDetail /></WizardGuard></ProtectedRoute>} />
          <Route path="/assessments" element={<ProtectedRoute><WizardGuard><Assessments /></WizardGuard></ProtectedRoute>} />
          <Route path="/debt-eliminator" element={<ProtectedRoute><WizardGuard><DebtEliminator /></WizardGuard></ProtectedRoute>} />
          <Route path="/complete-phone" element={<ProtectedRoute><CompletePhone /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/company-dashboard" element={<ProtectedRoute><WizardGuard><CompanyDashboard /></WizardGuard></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          {/* /join — no ProtectedRoute; handles auth inline */}
          <Route path="/join" element={<Join />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </NavigationBlockerProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
