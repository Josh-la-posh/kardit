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

            {/* Placeholder Routes */}
            <Route path="/loads" element={<PlaceholderPage title="Loads" description="Load transactions" />} />
            <Route path="/batch-operations" element={<PlaceholderPage title="Batch Operations" description="Bulk processing" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" description="Analytics and reports" />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications" description="All notifications" />} />
            <Route path="/audit-logs" element={<PlaceholderPage title="Audit Logs" description="Activity history" />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
