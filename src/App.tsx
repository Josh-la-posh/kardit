import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import IamCallbackPage from "./pages/IamCallbackPage";

// Dashboard
import DashboardPage from "./pages/DashboardPage";
import AffiliateBanksPage from "./pages/affiliate/AffiliateBanksPage";
import AffiliateBankRequestPage from "./pages/affiliate/AffiliateBankRequestPage";
import ProfilePage from "./pages/ProfilePage";
import BankDashboardPage from "./pages/bank/BankDashboardPage";
import ActiveAffiliatesPage from "./pages/bank/ActiveAffiliatesPage";
// import InactiveAffiliatesPage from "./pages/bank/InactiveAffiliatesPage";
import AffiliateDetailPages from "./pages/bank/AffiliateDetailPage";
import BankAffiliateCustomersPage from "./pages/bank/AffiliateCustomersPage";
import BankAffiliateCustomerDetailPage from "./pages/bank/AffiliateCustomerDetailPage";
import CustomersPage from "./pages/bank/CustomersPage";
import BankAffiliatesListPage from "./pages/bank/BankAffiliatesListPage";
import BankPartnershipRequestsPage from "./pages/bank/BankPartnershipRequestsPage";
import BankPartnershipRequestDetailPage from "./pages/bank/BankPartnershipRequestDetailPage";
import BankAuditLogsPage from "./pages/bank/BankAuditLogsPage";
import SuperAdminDashboardPage from "./pages/super-admin/SuperAdminDashboardPage";
import AffiliatesPage from "./pages/super-admin/affiliates/AffiliatesPage";
import SuperAdminAffiliateDetailPage from "./pages/super-admin/affiliates/SuperAdminAffiliateDetailPage";
import PendingApprovalPage from "./pages/super-admin/affiliates/PendingApprovalPage";
import ApprovedAffiliatesPage from "./pages/super-admin/ApprovedAffiliatesPage";

// Super Admin Bank Management
import BanksListPage from "./pages/super-admin/banks/BanksListPage";
import BankDetailPage from "./pages/super-admin/banks/BankDetailPage";
import AffiliateDetailPage from "./pages/super-admin/banks/AffiliateDetailPage";
import AffiliateCustomersPage from "./pages/super-admin/banks/AffiliateCustomersPage";
import AffiliateCustomerDetailPage from "./pages/super-admin/banks/AffiliateCustomerDetailPage";

// Issuing Banks (Service Provider)
import IssuingBanksListPage from "./pages/issuing-banks/IssuingBanksListPage";
import IssuingBankCreatePage from "./pages/issuing-banks/IssuingBankCreatePage";
import IssuingBankProvisioningPage from "./pages/issuing-banks/IssuingBankProvisioningPage";
import IssuingBankSuccessPage from "./pages/issuing-banks/IssuingBankSuccessPage";
import IssuingBankFailurePage from "./pages/issuing-banks/IssuingBankFailurePage";
import IssuingBankDetailPage from "./pages/issuing-banks/IssuingBankDetailPage";

// Onboarding (public)
import OnboardingStartPage from "./pages/onboarding/OnboardingStartPage";
import OnboardingOrganizationPage from "./pages/onboarding/OnboardingOrganizationPage";
import OnboardingDocumentsPage from "./pages/onboarding/OnboardingDocumentsPage";
import OnboardingIssuingBanksPage from "./pages/onboarding/OnboardingIssuingBanksPage";
import OnboardingReviewSubmitPage from "./pages/onboarding/OnboardingReviewSubmitPage";
import OnboardingSuccessPage from "./pages/onboarding/OnboardingSuccessPage";
import OnboardingStatusPage from "./pages/onboarding/OnboardingStatusPage";
import OnboardingNotificationsPage from "./pages/onboarding/OnboardingNotificationsPage";

// Onboarding (service provider reviewer)
import OnboardingCasesListPage from "./pages/super-admin/onboarding/OnboardingCasesListPage";
import OnboardingCaseDetailPage from "./pages/super-admin/onboarding/OnboardingCaseDetailPage";

// User Management
import UsersListPage from "./pages/users/UsersListPage";
import CreateUserPage from "./pages/users/CreateUserPage";
import UserDetailPage from "./pages/users/UserDetailPage";

// Customer Management
import CustomersListPage from "./pages/customers/CustomersListPage";
import CreateCustomerPage from "./pages/customers/CreateCustomerPage";
import {
  CardStepRoute,
  CustomerStepRoute,
  ResultStepRoute,
  ReviewStepRoute,
} from "./pages/customers/create-customer-steps/CreateCustomerStepRoutes";
import CustomerProfilePage from "./pages/customers/CustomerProfilePage";
import CustomerBatchesPage from "./pages/customers/CustomerBatchesPage";
import IssueCardPage from "./pages/customers/IssueCardPage";

// Card Management
import CardsListPage from "./pages/cards/CardsListPage";
import CardIssueStartPage from "./pages/cards/CardIssueStartPage";
import CardDetailPage from "./pages/cards/CardDetailPage";
import CreateCardPage from "./pages/cards/CreateCardPage";

// Batch Operations
import BatchOperationsPage from "./pages/batch/BatchOperationsPage";
import BatchUploadPage from "./pages/batch/BatchUploadPage";
import BatchOperationDetailPage from "./pages/batch/BatchOperationDetailPage";

// Loads
import LoadsHomePage from "./pages/loads/LoadsHomePage";
import SingleLoadPage from "./pages/loads/SingleLoadPage";
import LoadReversalPage from "./pages/loads/LoadReversalPage";
import LoadBatchesPage from "./pages/loads/LoadBatchesPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import TransactionDetailPage from "./pages/transactions/TransactionDetailPage";

// Reports
import ReportsLandingPage from "./pages/reports/ReportsLandingPage";
import ReportDetailPage from "./pages/reports/ReportDetailPage";

// Notifications
import NotificationsListPage from "./pages/notifications/NotificationsListPage";
import NotificationDetailPage from "./pages/notifications/NotificationDetailPage";

// Audit Logs
import AuditLogsListPage from "./pages/audit/AuditLogsListPage";
import AuditLogDetailPage from "./pages/audit/AuditLogDetailPage";

// Docs
import SrsPage from "./pages/SrsPage";

// Other
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import Page from "./pages/LandingPage/page";
import PublicLayout from "./layouts/PublicLayout";
import Contact from "./pages/Contact";
import Solutions from "./pages/Solutions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="kardit-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Public/Auth Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Page/>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/callback" element={<IamCallbackPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/solutions" element={<Solutions />} />

              {/* Affiliate onboarding (no login) */}
              <Route path="/onboarding/start" element={<OnboardingStartPage />} />
              <Route path="/onboarding/organization" element={<OnboardingOrganizationPage />} />
              <Route path="/onboarding/:draftId/organization" element={<OnboardingOrganizationPage />} />
              <Route path="/onboarding/:draftId/documents" element={<OnboardingDocumentsPage />} />
              <Route path="/onboarding/:draftId/issuing-banks" element={<OnboardingIssuingBanksPage />} />
              <Route path="/onboarding/:draftId/review" element={<OnboardingReviewSubmitPage />} />
              <Route path="/onboarding/success/:caseId" element={<OnboardingSuccessPage />} />
              <Route path="/onboarding/status/:caseId" element={<OnboardingStatusPage />} />
              <Route path="/onboarding/notifications/:caseId" element={<OnboardingNotificationsPage />} />
            </Route>
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/banks" element={<AffiliateBanksPage />} />
            <Route path="/banks/request-partnership" element={<AffiliateBankRequestPage />} />
            <Route path="/bank/dashboard" element={<BankDashboardPage />} />
            <Route path="/bank/affiliates" element={<BankAffiliatesListPage />} />
            <Route path="/bank/affiliate-partnership-requests" element={<BankPartnershipRequestsPage />} />
            <Route path="/bank/affiliate-partnership-requests/:partnershipRequestId" element={<BankPartnershipRequestDetailPage />} />
            <Route path="/bank/audit-logs" element={<BankAuditLogsPage />} />
            <Route path="/bank/affiliates/:affiliateId" element={<AffiliateDetailPages />} />
            <Route path="/bank/affiliates/:affiliateId/customers" element={<BankAffiliateCustomersPage />} />
            <Route path="/bank/affiliates/:affiliateId/customers/:customerId" element={<BankAffiliateCustomerDetailPage />} />
            <Route path="/bank/active-affiliates" element={<ActiveAffiliatesPage />} />
            <Route path="/bank/active-affiliates/:affiliateId" element={<AffiliateDetailPages />} />
            <Route path="/bank/active-affiliates/:affiliateId/customers" element={<BankAffiliateCustomersPage />} />
            <Route path="/bank/active-affiliates/:affiliateId/customers/:customerId" element={<BankAffiliateCustomerDetailPage />} />
            {/* <Route path="/bank/inactive-affiliates" element={<InactiveAffiliatesPage />} /> */}
            <Route path="/bank/customers" element={<CustomersPage />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboardPage />} />
            <Route path="/super-admin/affiliates" element={<AffiliatesPage />} />
            <Route path="/super-admin/affiliates/:affiliateId" element={<SuperAdminAffiliateDetailPage />} />
            <Route path="/super-admin/pending-approval" element={<PendingApprovalPage />} />
            <Route path="/super-admin/approved" element={<ApprovedAffiliatesPage />} />

            {/* Service provider bank management */}
            <Route path="/super-admin/banks" element={<BanksListPage />} />
            <Route path="/super-admin/banks/:bankId" element={<BankDetailPage />} />
            <Route path="/super-admin/banks/:bankId/affiliates/:affiliateId" element={<AffiliateDetailPage />} />
            <Route path="/super-admin/banks/:bankId/affiliates/:affiliateId/customers" element={<AffiliateCustomersPage />} />
            <Route path="/super-admin/banks/:bankId/affiliates/:affiliateId/customers/:customerId" element={<AffiliateCustomerDetailPage />} />

            {/* Issuing Banks (Service Provider) */}
            <Route path="/issuing-banks" element={<IssuingBanksListPage />} />
            <Route path="/issuing-banks/new" element={<IssuingBankCreatePage />} />
            <Route path="/issuing-banks/:sessionId/provisioning" element={<IssuingBankProvisioningPage />} />
            <Route path="/issuing-banks/:sessionId/success" element={<IssuingBankSuccessPage />} />
            <Route path="/issuing-banks/:sessionId/failure" element={<IssuingBankFailurePage />} />
            <Route path="/issuing-banks/:bankId/details" element={<IssuingBankDetailPage />} />

            {/* Service provider onboarding review */}
            <Route path="/super-admin/onboarding/cases" element={<OnboardingCasesListPage />} />
            <Route path="/super-admin/onboarding/cases/:caseId" element={<OnboardingCaseDetailPage />} />
            
            
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* User Management */}
            <Route path="/users" element={<UsersListPage />} />
            <Route path="/users/create" element={<CreateUserPage />} />
            <Route path="/users/:userId" element={<UserDetailPage />} />

            {/* Customer Management */}
            <Route path="/customers" element={<CustomersListPage />} />
            <Route path="/customers/create" element={<CreateCustomerPage />}>
              <Route index element={<Navigate to="/customers/create/customer" replace />} />
              <Route path="customer" element={<CustomerStepRoute />} />
              <Route path="card" element={<CardStepRoute />} />
              <Route path="review" element={<ReviewStepRoute />} />
              <Route path="result" element={<ResultStepRoute />} />
            </Route>
            <Route path="/customers/batches" element={<CustomerBatchesPage />} />
            <Route path="/customers/:customerId" element={<CustomerProfilePage />} />
            <Route path="/customers/:customerId/cards/new" element={<IssueCardPage />} />

            {/* Card Management */}
            <Route path="/card" element={<CardIssueStartPage />} />
            <Route path="/cards" element={<CardIssueStartPage />} />
            <Route path="/cards/list" element={<CardsListPage />} />
            <Route path="/cards/issue" element={<CardIssueStartPage />} />
            <Route path="/cards/create" element={<CreateCardPage />} />
            <Route path="/cards/:cardId" element={<CardDetailPage />} />

            {/* Loads */}
            <Route path="/loads" element={<LoadsHomePage />} />
            <Route path="/loads/single" element={<SingleLoadPage />} />
            <Route path="/loads/reversal" element={<LoadReversalPage />} />
            <Route path="/loads/batches" element={<LoadBatchesPage />} />
            <Route path="/loads/batches/:batchId" element={<LoadBatchesPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/:transactionId" element={<TransactionDetailPage />} />

            {/* Reports */}
            <Route path="/reports" element={<ReportsLandingPage />} />
            <Route path="/reports/:reportDefinitionId" element={<ReportDetailPage />} />

            {/* Notifications */}
            <Route path="/notifications" element={<NotificationsListPage />} />
            <Route path="/notifications/:id" element={<NotificationDetailPage />} />

            {/* Audit Logs */}
            <Route path="/audit-logs" element={<AuditLogsListPage />} />
            <Route path="/audit-logs/:id" element={<AuditLogDetailPage />} />

            {/* Docs */}
            <Route path="/docs/srs" element={<SrsPage />} />

            {/* Batch Operations */}
            <Route path="/batch-operations" element={<BatchOperationsPage />} />
            <Route path="/batch-operations/new" element={<BatchUploadPage />} />
            <Route path="/batch-operations/:batchId" element={<BatchOperationDetailPage />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
