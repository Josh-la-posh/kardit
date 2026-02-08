/**
 * Reports, Notifications, and Audit Logs mock store
 */

// ─── Report Types ───────────────────────────────────────────

export interface ReportDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  allowedFormats: ('CSV' | 'XLSX')[];
}

export type ReportInstanceStatus = 'IDLE' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ReportInstance {
  id: string;
  reportDefinitionId: string;
  createdAt: string;
  status: ReportInstanceStatus;
  filters: Record<string, any>;
  previewColumns?: string[];
  previewRows?: (string | number | null)[][];
}

// ─── Notification Types ─────────────────────────────────────

export type NotificationSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: 'Customer' | 'Card' | 'LoadBatch' | 'User' | 'Other';
  relatedEntityId?: string;
}

// ─── Audit Log Types ────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userEmail: string;
  actionType: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
}

// ─── Seed Data ──────────────────────────────────────────────

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  { id: 'rd1', code: 'CUST_OVERVIEW', name: 'Customers Overview', description: 'Summary of all customers with status breakdown', category: 'Customers', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'rd2', code: 'ACTIVE_CARDS', name: 'Active Cards', description: 'List of all active cards with balances', category: 'Cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'rd3', code: 'LOADS_SUMMARY', name: 'Loads Summary', description: 'Load transactions summary for a given period', category: 'Loads', allowedFormats: ['CSV'] },
  { id: 'rd4', code: 'BATCH_ERRORS', name: 'Batches Errors', description: 'Detailed error report for failed batch rows', category: 'Batches', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'rd5', code: 'AUDIT_TRAIL', name: 'Audit Trail', description: 'Complete audit log export', category: 'Audit', allowedFormats: ['CSV'] },
];

const PREVIEW_DATA: Record<string, { columns: string[]; rows: (string | number | null)[][] }> = {
  rd1: {
    columns: ['Customer ID', 'Name', 'Email', 'Status', 'Created'],
    rows: [
      ['CUS-10001', 'Alice Williams', 'alice.w@example.com', 'ACTIVE', '2025-03-15'],
      ['CUS-10002', 'Bob Martinez', 'bob.m@example.com', 'PENDING', '2026-01-20'],
      ['CUS-10003', 'Clara Nguyen', 'clara.n@example.com', 'ACTIVE', '2025-07-08'],
      ['CUS-10004', 'Daniel Okafor', 'daniel.o@example.com', 'REJECTED', '2026-01-05'],
      ['CUS-10005', 'Eva Schmidt', 'eva.s@example.com', 'ACTIVE', '2025-11-22'],
    ],
  },
  rd2: {
    columns: ['Masked PAN', 'Customer', 'Product', 'Status', 'Balance', 'Currency'],
    rows: [
      ['****-4532', 'Alice Williams', 'Kardit Gold', 'ACTIVE', 2450, 'USD'],
      ['****-5566', 'Clara Nguyen', 'Kardit Platinum', 'ACTIVE', 12300, 'USD'],
      ['****-9988', 'Clara Nguyen', 'Kardit Corporate', 'ACTIVE', 8500, 'EUR'],
    ],
  },
  rd3: {
    columns: ['Date', 'Card', 'Amount', 'Currency', 'Reference', 'Status'],
    rows: [
      ['2026-02-07', '****-4532', 1000, 'USD', 'REF-001', 'SUCCESS'],
      ['2026-02-05', '****-4532', 500, 'USD', 'REF-002', 'SUCCESS'],
      ['2026-02-06', '****-5566', 5000, 'USD', 'REF-003', 'SUCCESS'],
    ],
  },
  rd4: {
    columns: ['Batch ID', 'Row', 'Card', 'Amount', 'Error'],
    rows: [
      ['batch3', 3, '****-0000', 250, 'Card not found'],
      ['batch3', 7, '****-1111', 100, 'Invalid amount'],
    ],
  },
  rd5: {
    columns: ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID'],
    rows: [
      ['2026-02-07 14:30', 'admin@alphabank.com', 'USER_CREATE', 'User', 'u3'],
      ['2026-02-06 10:00', 'admin@alphabank.com', 'CARD_FREEZE', 'Card', 'card2'],
    ],
  },
};

let _notifications: AppNotification[] = [
  { id: 'n1', severity: 'WARNING', title: 'Large Load Detected', message: 'A load of $50,000 was processed for customer CUS-10001. This exceeds the standard threshold and requires manual review by a compliance officer.', createdAt: '2026-02-08T09:55:00Z', isRead: false, relatedEntityType: 'Customer', relatedEntityId: 'c1' },
  { id: 'n2', severity: 'INFO', title: 'Batch Processing Complete', message: 'Customer batch #batch1 has been successfully processed. 150 records were validated and imported into the system.', createdAt: '2026-02-08T09:30:00Z', isRead: false, relatedEntityType: 'Other' },
  { id: 'n3', severity: 'ERROR', title: 'Card Activation Failed', message: 'Card ending in 7891 failed activation due to verification issues. The card remains in FROZEN status. Please contact the customer to resolve.', createdAt: '2026-02-08T07:00:00Z', isRead: false, relatedEntityType: 'Card', relatedEntityId: 'card2' },
  { id: 'n4', severity: 'INFO', title: 'New User Registration', message: 'A new operator account (mike.c@alphabank.com) has been created and is pending first login.', createdAt: '2026-02-07T14:00:00Z', isRead: true, relatedEntityType: 'User', relatedEntityId: 'u3' },
  { id: 'n5', severity: 'INFO', title: 'System Maintenance Scheduled', message: 'Scheduled maintenance window: Tomorrow 02:00 - 04:00 UTC. Services may be intermittently unavailable.', createdAt: '2026-02-07T10:00:00Z', isRead: true },
  { id: 'n6', severity: 'WARNING', title: 'Compliance Alert', message: 'Monthly compliance report is due in 3 days. Please review all pending items and ensure documentation is up to date.', createdAt: '2026-02-06T12:00:00Z', isRead: false },
  { id: 'n7', severity: 'WARNING', title: 'API Rate Limit Warning', message: 'Partner API usage is at 85% of daily limit. Consider optimizing batch sizes or spreading requests.', createdAt: '2026-02-06T08:00:00Z', isRead: true },
  { id: 'n8', severity: 'ERROR', title: 'Batch Upload Failed', message: 'Customer batch customers_onboard.csv failed validation. 12 of 42 records contained errors. Please review and re-upload.', createdAt: '2026-02-05T16:00:00Z', isRead: true, relatedEntityType: 'Other' },
  { id: 'n9', severity: 'INFO', title: 'Card Issued Successfully', message: 'A new Kardit Gold card has been issued to customer CUS-10005 (Eva Schmidt) via Gamma Trust.', createdAt: '2026-02-05T10:00:00Z', isRead: true, relatedEntityType: 'Card', relatedEntityId: 'card6' },
  { id: 'n10', severity: 'INFO', title: 'Customer KYC Verified', message: 'All KYC documents for customer CUS-10001 (Alice Williams) have been verified and approved.', createdAt: '2026-02-04T09:00:00Z', isRead: true, relatedEntityType: 'Customer', relatedEntityId: 'c1' },
];

let _auditLogs: AuditLogEntry[] = [
  { id: 'al1', timestamp: '2026-02-08T09:30:00Z', userEmail: 'admin@alphabank.com', actionType: 'USER_CREATE', entityType: 'User', entityId: 'u3', ipAddress: '192.168.1.100', userAgent: 'Chrome/121.0', oldValue: undefined, newValue: { firstName: 'Mike', lastName: 'Chen', email: 'mike.c@alphabank.com', status: 'INVITED' } },
  { id: 'al2', timestamp: '2026-02-07T14:30:00Z', userEmail: 'admin@alphabank.com', actionType: 'LOAD_EXECUTE', entityType: 'Card', entityId: 'card1', ipAddress: '192.168.1.100', userAgent: 'Chrome/121.0', oldValue: { currentBalance: 1450 }, newValue: { currentBalance: 2450, loadAmount: 1000 } },
  { id: 'al3', timestamp: '2026-02-06T10:00:00Z', userEmail: 'sarah.j@alphabank.com', actionType: 'CARD_FREEZE', entityType: 'Card', entityId: 'card2', ipAddress: '192.168.1.101', userAgent: 'Firefox/122.0', oldValue: { status: 'ACTIVE' }, newValue: { status: 'FROZEN' } },
  { id: 'al4', timestamp: '2026-02-05T11:00:00Z', userEmail: 'admin@alphabank.com', actionType: 'CUSTOMER_CREATE', entityType: 'Customer', entityId: 'c5', ipAddress: '192.168.1.100', userAgent: 'Chrome/121.0', oldValue: undefined, newValue: { firstName: 'Eva', lastName: 'Schmidt', email: 'eva.s@example.com', status: 'ACTIVE' } },
  { id: 'al5', timestamp: '2026-02-04T16:00:00Z', userEmail: 'sarah.j@alphabank.com', actionType: 'KYC_VERIFY', entityType: 'Customer', entityId: 'c1', ipAddress: '192.168.1.101', userAgent: 'Firefox/122.0', oldValue: { kycStatus: 'UPLOADED' }, newValue: { kycStatus: 'VERIFIED' } },
  { id: 'al6', timestamp: '2026-02-03T09:00:00Z', userEmail: 'admin@alphabank.com', actionType: 'USER_STATUS_CHANGE', entityType: 'User', entityId: 'u4', ipAddress: '192.168.1.100', userAgent: 'Chrome/121.0', oldValue: { status: 'ACTIVE' }, newValue: { status: 'LOCKED' } },
  { id: 'al7', timestamp: '2026-02-02T14:00:00Z', userEmail: 'admin@alphabank.com', actionType: 'CARD_BLOCK', entityType: 'Card', entityId: 'card6', ipAddress: '192.168.1.100', userAgent: 'Chrome/121.0', oldValue: { status: 'ACTIVE' }, newValue: { status: 'BLOCKED', reason: 'Suspected fraud' } },
  { id: 'al8', timestamp: '2026-02-01T10:00:00Z', userEmail: 'sarah.j@alphabank.com', actionType: 'BATCH_UPLOAD', entityType: 'Batch', entityId: 'batch2', ipAddress: '192.168.1.101', userAgent: 'Firefox/122.0', oldValue: undefined, newValue: { fileName: 'customers_feb_2026.csv', totalRecords: 85 } },
];

let _nextId = 600;
const genId = (prefix: string) => `${prefix}${_nextId++}`;

export const reportStore = {
  // Reports
  getDefinitions: () => REPORT_DEFINITIONS,
  getDefinition: (id: string) => REPORT_DEFINITIONS.find(d => d.id === id) || null,
  generatePreview: (defId: string): { columns: string[]; rows: (string | number | null)[][] } | null => {
    return PREVIEW_DATA[defId] || null;
  },

  // Notifications
  getNotifications: () => [..._notifications],
  getNotification: (id: string) => _notifications.find(n => n.id === id) || null,
  getUnreadCount: () => _notifications.filter(n => !n.isRead).length,
  markAsRead: (id: string) => {
    const idx = _notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      _notifications[idx] = { ..._notifications[idx], isRead: true, readAt: new Date().toISOString() };
      _notifications = [..._notifications];
    }
  },
  markAllAsRead: () => {
    const now = new Date().toISOString();
    _notifications = _notifications.map(n => n.isRead ? n : { ...n, isRead: true, readAt: now });
  },
  toggleRead: (id: string) => {
    const idx = _notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      const n = _notifications[idx];
      _notifications[idx] = { ...n, isRead: !n.isRead, readAt: !n.isRead ? new Date().toISOString() : undefined };
      _notifications = [..._notifications];
    }
  },

  // Audit Logs
  getAuditLogs: () => [..._auditLogs],
  getAuditLog: (id: string) => _auditLogs.find(a => a.id === id) || null,
};
