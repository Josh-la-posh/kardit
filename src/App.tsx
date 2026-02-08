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

// Dashboard
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";

// User Management
import UsersListPage from "./pages/users/UsersListPage";
import CreateUserPage from "./pages/users/CreateUserPage";
import UserDetailPage from "./pages/users/UserDetailPage";

// Customer Management
import CustomersListPage from "./pages/customers/CustomersListPage";
import CreateCustomerPage from "./pages/customers/CreateCustomerPage";
import CustomerProfilePage from "./pages/customers/CustomerProfilePage";
import CustomerBatchesPage from "./pages/customers/CustomerBatchesPage";
import IssueCardPage from "./pages/customers/IssueCardPage";

// Card Management
import CardsListPage from "./pages/cards/CardsListPage";
import CardDetailPage from "./pages/cards/CardDetailPage";

// Loads
import LoadsHomePage from "./pages/loads/LoadsHomePage";
import SingleLoadPage from "./pages/loads/SingleLoadPage";
import LoadReversalPage from "./pages/loads/LoadReversalPage";
import LoadBatchesPage from "./pages/loads/LoadBatchesPage";

// Reports
import ReportsLandingPage from "./pages/reports/ReportsLandingPage";
import ReportDetailPage from "./pages/reports/ReportDetailPage";

// Notifications
import NotificationsListPage from "./pages/notifications/NotificationsListPage";
import NotificationDetailPage from "./pages/notifications/NotificationDetailPage";

// Audit Logs
import AuditLogsListPage from "./pages/audit/AuditLogsListPage";
import AuditLogDetailPage from "./pages/audit/AuditLogDetailPage";

// Other
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
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* User Management */}
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/create" element={<CreateUserPage />} />
            <Route path="/users/:userId" element={<UserDetailPage />} />

            {/* Customer Management */}
            <Route path="/customers" element={<CustomersListPage />} />
            <Route path="/customers/create" element={<CreateCustomerPage />} />
            <Route path="/customers/batches" element={<CustomerBatchesPage />} />
            <Route path="/customers/:customerId" element={<CustomerProfilePage />} />
            <Route path="/customers/:customerId/cards/new" element={<IssueCardPage />} />

            {/* Card Management */}
            <Route path="/cards" element={<CardsListPage />} />
            <Route path="/cards/:cardId" element={<CardDetailPage />} />

            {/* Loads */}
            <Route path="/loads" element={<LoadsHomePage />} />
            <Route path="/loads/single" element={<SingleLoadPage />} />
            <Route path="/loads/reversal" element={<LoadReversalPage />} />
            <Route path="/loads/batches" element={<LoadBatchesPage />} />
            <Route path="/loads/batches/:batchId" element={<LoadBatchesPage />} />

            {/* Reports */}
            <Route path="/reports" element={<ReportsLandingPage />} />
            <Route path="/reports/:reportDefinitionId" element={<ReportDetailPage />} />

            {/* Notifications */}
            <Route path="/notifications" element={<NotificationsListPage />} />
            <Route path="/notifications/:id" element={<NotificationDetailPage />} />

            {/* Audit Logs */}
            <Route path="/audit-logs" element={<AuditLogsListPage />} />
            <Route path="/audit-logs/:id" element={<AuditLogDetailPage />} />

            {/* Placeholder Routes */}
            <Route path="/batch-operations" element={<PlaceholderPage title="Batch Operations" description="Bulk processing" />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
