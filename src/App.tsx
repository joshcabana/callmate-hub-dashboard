import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import CallLogs from "./pages/CallLogs";
import AgentSettings from "./pages/AgentSettings";
import Billing from "./pages/Billing";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Onboarding — protected but outside DashboardLayout */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Protected dashboard routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/call-logs" element={<CallLogs />} />
                      <Route path="/agent-settings" element={<AgentSettings />} />
                      <Route path="/billing" element={<Billing />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
