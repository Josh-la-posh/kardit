export type SuperAdminUserType = 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | 'ADMIN' | string;

export interface SuperAdminRequestContext {
  actorUserId: string;
  userType: SuperAdminUserType;
  tenantId: string;
}

export interface SuperAdminDashboardMetrics {
  totalTenants: number;
  totalBanks: number;
  totalCardsIssued: number;
  activeCards: number;
  frozenCards: number;
  terminatedCards: number;
  globalFundingVolume: number;
  globalUnloadVolume: number;
  globalTransactionVolume: number;
  pendingApprovals: number;
  failedCmsRequests: number;
  errorRatePercentage: number;
}

export interface GetSuperAdminDashboardResponse {
  metrics: SuperAdminDashboardMetrics;
  generatedAt: string;
}

export interface AuditLogFilters {
  fromDate?: string;
  toDate?: string;
  eventType?: string;
  entityId?: string;
}

export interface AuditLogPagination {
  page: number;
  pageSize: number;
}

export interface ListSuperAdminAuditLogsRequest {
  requestContext: SuperAdminRequestContext;
  filters?: AuditLogFilters;
  pagination: AuditLogPagination;
}

export interface SuperAdminAuditLog {
  auditId: string;
  eventType: string;
  actorUserId: string;
  actorRole: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  correlationId?: string;
  timestamp: string;
  status: string;
}

export interface ListSuperAdminAuditLogsResponse {
  results: SuperAdminAuditLog[];
  page: number;
  pageSize: number;
  total: number;
}

export type NotificationStatus = 'READ' | 'UNREAD' | string;

export interface SuperAdminNotification {
  notificationId: string;
  type: string;
  message: string;
  status: NotificationStatus;
  createdAt: string;
}

export interface ListNotificationsResponse {
  notifications: SuperAdminNotification[];
}

export interface UpdateNotificationStatusRequest {
  status: NotificationStatus;
}

export interface NotificationChannelSettings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

export interface SaveNotificationSettingsRequest {
  tenantId: string;
  channels: NotificationChannelSettings;
}

export type ReportExportFormat = 'CSV' | 'XLSX' | 'PDF' | string;

export interface GenerateReportRequest {
  requestContext: SuperAdminRequestContext;
  reportType: string;
  filters?: Record<string, unknown>;
  exportFormat: ReportExportFormat;
}

export interface GenerateReportQueuedResponse {
  reportExecutionId: string;
  status: 'QUEUED' | string;
  estimatedCompletionTime: string;
}

export interface GenerateReportCompletedResponse {
  reportExecutionId: string;
  status: 'COMPLETED' | string;
  fileName: string;
  downloadUrl: string;
  generatedAt: string;
}

export type GenerateReportResponse = GenerateReportQueuedResponse | GenerateReportCompletedResponse;

export interface GetReportStatusResponse {
  reportExecutionId: string;
  status: string;
  fileName?: string;
  downloadUrl?: string;
  completedAt?: string;
}

export interface QueryBanksFilters {
  status?: string[] | null;
  country?: string | null;
  search?: string | null;
}

export interface QueryBanksRequest {
  filters: QueryBanksFilters;
  page: number;
  pageSize: number;
}

export interface BankQueryItem {
  bankId: string;
  bankName: string;
  bankCode: string;
  status: string;
  supportedCurrencies?: string[];
  createdAt: string;
}

export interface QueryBanksResponse {
  page: number;
  pageSize: number;
  total: number;
  data: BankQueryItem[];
}

export interface QueryAffiliatesFilters {
  status?: string[] | null;
  bankId?: string | null;
  country?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  search?: string | null;
}

export interface QueryAffiliatesRequest {
  filters: QueryAffiliatesFilters;
  page: number;
  pageSize: number;
}

export interface AffiliateQueryItem {
  affiliateId: string;
  tenantId: string;
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
  country: string;
  status: string;
  createdAt: string;
}

export interface QueryAffiliatesResponse {
  page: number;
  pageSize: number;
  total: number;
  data: AffiliateQueryItem[];
}
