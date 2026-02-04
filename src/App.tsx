import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

// Dashboard Pages
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import PlaceholderPage from "./pages/PlaceholderPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* Placeholder Routes - To be implemented later */}
            <Route 
              path="/customers" 
              element={<PlaceholderPage title="Customers" description="Manage your customers" />} 
            />
            <Route 
              path="/cards" 
              element={<PlaceholderPage title="Cards" description="Card management" />} 
            />
            <Route 
              path="/loads" 
              element={<PlaceholderPage title="Loads" description="Load transactions" />} 
            />
            <Route 
              path="/batch-operations" 
              element={<PlaceholderPage title="Batch Operations" description="Bulk processing" />} 
            />
            <Route 
              path="/reports" 
              element={<PlaceholderPage title="Reports" description="Analytics and reports" />} 
            />
            <Route 
              path="/notifications" 
              element={<PlaceholderPage title="Notifications" description="All notifications" />} 
            />
            <Route 
              path="/audit-logs" 
              element={<PlaceholderPage title="Audit Logs" description="Activity history" />} 
            />
            <Route 
              path="/users" 
              element={<PlaceholderPage title="User Management" description="Manage system users" />} 
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
