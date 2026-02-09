/**
 * Mutable in-memory mock store for Kardit
 * All CRUD operations mutate these arrays directly.
 * Hooks read from and write to this store.
 */

// ─── Types ───────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export type UserStatus = 'ACTIVE' | 'INVITED' | 'LOCKED' | 'DISABLED';

export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: UserStatus;
  roles: Role[];
  permissionOverrides?: { permission: string; action: 'GRANT' | 'REVOKE' }[];
  lastLoginAt?: string;
  createdAt: string;
}

export type CustomerStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface CustomerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Customer {
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  embossName?: string;
  email: string;
  phone?: string;
  status: CustomerStatus;
  createdAt: string;
  dateOfBirth?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  idExpiryDate?: string;
  address?: CustomerAddress;
  rib?: string;
  agencyCode?: string;
}

export type KycDocumentStatus = 'UPLOADED' | 'VERIFIED' | 'REJECTED';

export interface KycDocument {
  id: string;
  customerId: string;
  type: 'ID_FRONT' | 'ID_BACK' | 'PROOF_OF_ADDRESS' | string;
  status: KycDocumentStatus;
  fileName: string;
  uploadedAt: string;
}

export type CardStatus = 'PENDING' | 'ACTIVE' | 'FROZEN' | 'BLOCKED';

export interface Card {
  id: string;
  customerId: string;
  maskedPan: string;
  productName: string;
  productCode: string;
  issuingBankName: string;
  status: CardStatus;
  currency: string;
  currentBalance: number;
  createdAt: string;
  embossName?: string;
  deliveryMethod?: string;
}

export type BatchStatus = 'UPLOADED' | 'VALIDATING' | 'VALIDATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CustomerBatch {
  id: string;
  fileName: string;
  status: BatchStatus;
  totalRecords?: number;
  createdAt: string;
}

// ─── CMS Action History ─────────────────────────────────────

export interface CMSActionRecord {
  id: string;
  entityType: 'CARD' | 'LOAD' | 'CUSTOMER';
  entityId: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface PendingCMSRequest {
  id: string;
  customerId: string;
  payload: Record<string, any>;
  createdAt: string;
}

// ─── Constants / Lookups ────────────────────────────────────

export const ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Full system access' },
  { id: 'r2', name: 'Operator', description: 'Day-to-day operations' },
  { id: 'r3', name: 'Analyst', description: 'View reports and analytics' },
  { id: 'r4', name: 'Compliance', description: 'Compliance and audit access' },
];

export const CARD_PRODUCTS = [
  { id: 'cp1', name: 'Kardit Classic', code: 'KRD_CLS' },
  { id: 'cp2', name: 'Kardit Gold', code: 'KRD_GLD' },
  { id: 'cp3', name: 'Kardit Platinum', code: 'KRD_PLT' },
  { id: 'cp4', name: 'Kardit Corporate', code: 'KRD_CRP' },
];

export const ISSUING_BANKS = [
  { id: 'ib1', name: 'Alpha Bank' },
  { id: 'ib2', name: 'Beta Financial' },
  { id: 'ib3', name: 'Gamma Trust' },
];

export const CURRENCIES = [
  { code: 'USD', numeric: '840', label: 'USD (840)' },
  { code: 'EUR', numeric: '978', label: 'EUR (978)' },
  { code: 'AED', numeric: '784', label: 'AED (784)' },
  { code: 'GBP', numeric: '826', label: 'GBP (826)' },
  { code: 'MAD', numeric: '504', label: 'MAD (504)' },
  { code: 'SAR', numeric: '682', label: 'SAR (682)' },
];

export const ID_TYPES = [
  { id: 'passport', label: 'Passport', code: 'PP' },
  { id: 'national_id', label: 'National ID', code: 'NID' },
  { id: 'driver_license', label: 'Driver License', code: 'DL' },
  { id: 'residence_permit', label: 'Residence Permit', code: 'RP' },
];

export const DELIVERY_METHODS = [
  { id: 'home', label: 'Home Delivery', code: 'HOME_DELIVERY' },
  { id: 'branch', label: 'Branch Pickup', code: 'BRANCH_PICKUP' },
  { id: 'courier', label: 'Express Courier', code: 'EXPRESS_COURIER' },
];

export const CARD_ACTION_CODES = {
  L: { label: 'Temporary Lock', targetStatus: 'FROZEN' as CardStatus },
  U: { label: 'Unlock', targetStatus: 'ACTIVE' as CardStatus },
  P: { label: 'Permanent Lock', targetStatus: 'BLOCKED' as CardStatus },
};

export const CARD_REASON_CODES: Record<string, { code: string; label: string }[]> = {
  L: [
    { code: 'L01', label: 'Customer request' },
    { code: 'L02', label: 'Suspected fraud' },
    { code: 'L03', label: 'Lost card' },
    { code: 'L04', label: 'Compliance hold' },
  ],
  U: [
    { code: 'U01', label: 'Customer request' },
    { code: 'U02', label: 'Fraud cleared' },
    { code: 'U03', label: 'Card found' },
  ],
  P: [
    { code: 'P01', label: 'Stolen card' },
    { code: 'P02', label: 'Confirmed fraud' },
    { code: 'P03', label: 'Account closed' },
    { code: 'P04', label: 'Compliance block' },
    { code: 'P05', label: 'Customer request – permanent' },
  ],
};

// ─── Seed Data ───────────────────────────────────────────────

let _users: ManagedUser[] = [
  {
    id: 'u1', firstName: 'John', lastName: 'Doe', email: 'admin@alphabank.com', phone: '+1-555-0101',
    status: 'ACTIVE', roles: [ROLES[0]], lastLoginAt: '2026-02-06T10:30:00Z', createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'u2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@alphabank.com', phone: '+1-555-0102',
    status: 'ACTIVE', roles: [ROLES[1]], lastLoginAt: '2026-02-05T14:20:00Z', createdAt: '2024-06-20T11:00:00Z',
  },
  {
    id: 'u3', firstName: 'Mike', lastName: 'Chen', email: 'mike.c@alphabank.com',
    status: 'INVITED', roles: [ROLES[2]], createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u4', firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.r@alphabank.com',
    status: 'LOCKED', roles: [ROLES[1], ROLES[3]], lastLoginAt: '2026-01-28T16:45:00Z', createdAt: '2025-03-12T10:00:00Z',
  },
  {
    id: 'u5', firstName: 'David', lastName: 'Kim', email: 'fail-invite@kardit.app',
    status: 'DISABLED', roles: [ROLES[2]], createdAt: '2025-08-01T09:00:00Z',
  },
];

let _customers: Customer[] = [
  {
    id: 'c1', customerId: 'CUS-10001', firstName: 'Alice', lastName: 'Williams', embossName: 'ALICE WILLIAMS',
    email: 'alice.w@example.com', phone: '+1-555-1001', status: 'ACTIVE', createdAt: '2025-03-15T10:00:00Z',
    dateOfBirth: '1990-05-12', nationality: 'US', idType: 'passport', idNumber: 'P1234567', idExpiryDate: '2030-05-12',
    address: { line1: '123 Main St', city: 'New York', state: 'NY', country: 'US', postalCode: '10001' },
    rib: '1234567890123456789012', agencyCode: 'AG001',
  },
  {
    id: 'c2', customerId: 'CUS-10002', firstName: 'Bob', lastName: 'Martinez', embossName: 'BOB MARTINEZ',
    email: 'bob.m@example.com', phone: '+1-555-1002', status: 'PENDING', createdAt: '2026-01-20T14:00:00Z',
    dateOfBirth: '1985-11-03', nationality: 'MX', idType: 'national_id', idNumber: 'NID987654', idExpiryDate: '2028-11-03',
    address: { line1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'US', postalCode: '90001' },
    rib: '9876543210987654321098', agencyCode: 'AG002',
  },
  {
    id: 'c3', customerId: 'CUS-10003', firstName: 'Clara', lastName: 'Nguyen', embossName: 'CLARA NGUYEN',
    email: 'clara.n@example.com', status: 'ACTIVE', createdAt: '2025-07-08T09:00:00Z',
    dateOfBirth: '1992-08-25', nationality: 'VN', idType: 'passport', idNumber: 'P7654321', idExpiryDate: '2029-08-25',
    address: { line1: '789 Pine Rd', city: 'Houston', state: 'TX', country: 'US', postalCode: '77001' },
  },
  {
    id: 'c4', customerId: 'CUS-10004', firstName: 'Daniel', lastName: 'Okafor',
    email: 'daniel.o@example.com', phone: '+44-20-7946-0958', status: 'REJECTED', createdAt: '2026-01-05T08:00:00Z',
    dateOfBirth: '1988-02-14', nationality: 'NG', idType: 'driver_license', idNumber: 'DL-456789', idExpiryDate: '2027-02-14',
  },
  {
    id: 'c5', customerId: 'CUS-10005', firstName: 'Eva', lastName: 'Schmidt', embossName: 'EVA SCHMIDT',
    email: 'eva.s@example.com', phone: '+49-30-12345678', status: 'ACTIVE', createdAt: '2025-11-22T12:00:00Z',
    dateOfBirth: '1995-06-30', nationality: 'DE', idType: 'national_id', idNumber: 'DE-ID-112233', idExpiryDate: '2031-06-30',
    address: { line1: '10 Berliner Str', city: 'Berlin', country: 'DE', postalCode: '10115' },
  },
];

let _kycDocuments: KycDocument[] = [
  { id: 'kyc1', customerId: 'c1', type: 'ID_FRONT', status: 'VERIFIED', fileName: 'alice_passport_front.jpg', uploadedAt: '2025-03-15T10:05:00Z' },
  { id: 'kyc2', customerId: 'c1', type: 'ID_BACK', status: 'VERIFIED', fileName: 'alice_passport_back.jpg', uploadedAt: '2025-03-15T10:06:00Z' },
  { id: 'kyc3', customerId: 'c1', type: 'PROOF_OF_ADDRESS', status: 'VERIFIED', fileName: 'alice_utility_bill.pdf', uploadedAt: '2025-03-15T10:07:00Z' },
  { id: 'kyc4', customerId: 'c2', type: 'ID_FRONT', status: 'UPLOADED', fileName: 'bob_id_front.jpg', uploadedAt: '2026-01-20T14:10:00Z' },
  { id: 'kyc5', customerId: 'c3', type: 'ID_FRONT', status: 'VERIFIED', fileName: 'clara_passport.jpg', uploadedAt: '2025-07-08T09:10:00Z' },
  { id: 'kyc6', customerId: 'c3', type: 'PROOF_OF_ADDRESS', status: 'REJECTED', fileName: 'clara_bank_stmt.pdf', uploadedAt: '2025-07-08T09:12:00Z' },
  { id: 'kyc7', customerId: 'c4', type: 'ID_FRONT', status: 'REJECTED', fileName: 'daniel_dl_front.jpg', uploadedAt: '2026-01-05T08:05:00Z' },
];

let _cards: Card[] = [
  { id: 'card1', customerId: 'c1', maskedPan: '****-****-****-4532', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 2450.00, createdAt: '2025-03-16T09:00:00Z', embossName: 'ALICE WILLIAMS', deliveryMethod: 'BRANCH_PICKUP' },
  { id: 'card2', customerId: 'c1', maskedPan: '****-****-****-7891', productName: 'Kardit Classic', productCode: 'KRD_CLS', issuingBankName: 'Alpha Bank', status: 'FROZEN', currency: 'USD', currentBalance: 150.75, createdAt: '2025-06-01T10:00:00Z', embossName: 'ALICE WILLIAMS', deliveryMethod: 'HOME_DELIVERY' },
  { id: 'card3', customerId: 'c2', maskedPan: '****-****-****-3344', productName: 'Kardit Classic', productCode: 'KRD_CLS', issuingBankName: 'Beta Financial', status: 'PENDING', currency: 'USD', currentBalance: 0, createdAt: '2026-01-20T15:00:00Z', embossName: 'BOB MARTINEZ' },
  { id: 'card4', customerId: 'c3', maskedPan: '****-****-****-5566', productName: 'Kardit Platinum', productCode: 'KRD_PLT', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 12300.00, createdAt: '2025-07-09T11:00:00Z', embossName: 'CLARA NGUYEN' },
  { id: 'card5', customerId: 'c3', maskedPan: '****-****-****-9988', productName: 'Kardit Corporate', productCode: 'KRD_CRP', issuingBankName: 'Gamma Trust', status: 'ACTIVE', currency: 'EUR', currentBalance: 8500.00, createdAt: '2025-09-15T08:00:00Z', embossName: 'CLARA NGUYEN' },
  { id: 'card6', customerId: 'c5', maskedPan: '****-****-****-2211', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Gamma Trust', status: 'BLOCKED', currency: 'EUR', currentBalance: 320.50, createdAt: '2025-12-01T14:00:00Z', embossName: 'EVA SCHMIDT' },
];

let _batches: CustomerBatch[] = [
  { id: 'batch1', fileName: 'customers_jan_2026.csv', status: 'COMPLETED', totalRecords: 150, createdAt: '2026-01-15T09:00:00Z' },
  { id: 'batch2', fileName: 'customers_feb_2026.csv', status: 'PROCESSING', totalRecords: 85, createdAt: '2026-02-01T10:00:00Z' },
  { id: 'batch3', fileName: 'customers_onboard.csv', status: 'FAILED', totalRecords: 42, createdAt: '2026-02-03T11:00:00Z' },
];

let _cmsActions: CMSActionRecord[] = [];
let _pendingCmsRequests: PendingCMSRequest[] = [];

let _nextId = 100;
const genId = (prefix: string) => `${prefix}${_nextId++}`;

// ─── Accessors & Mutators ────────────────────────────────────

export const store = {
  // Users
  getUsers: () => [..._users],
  getUser: (id: string) => _users.find((u) => u.id === id) || null,
  createUser: (data: Omit<ManagedUser, 'id' | 'createdAt' | 'status'>): ManagedUser => {
    const user: ManagedUser = { ...data, id: genId('u'), status: 'INVITED', createdAt: new Date().toISOString() };
    _users = [..._users, user];
    return user;
  },
  updateUser: (id: string, patch: Partial<ManagedUser>): ManagedUser | null => {
    const idx = _users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    _users[idx] = { ..._users[idx], ...patch };
    _users = [..._users];
    return _users[idx];
  },

  // Customers
  getCustomers: () => [..._customers],
  getCustomer: (id: string) => _customers.find((c) => c.id === id) || null,
  createCustomer: (data: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'status'>): Customer => {
    const id = genId('c');
    const customer: Customer = {
      ...data,
      id,
      customerId: `CUS-${10000 + _nextId}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    _customers = [..._customers, customer];
    return customer;
  },

  // KYC Documents
  getKycDocuments: (customerId: string) => _kycDocuments.filter((d) => d.customerId === customerId),
  addKycDocument: (doc: Omit<KycDocument, 'id' | 'uploadedAt'>): KycDocument => {
    const kycDoc: KycDocument = { ...doc, id: genId('kyc'), uploadedAt: new Date().toISOString() };
    _kycDocuments = [..._kycDocuments, kycDoc];
    return kycDoc;
  },

  // Cards
  getCards: () => [..._cards],
  getCard: (id: string) => _cards.find((c) => c.id === id) || null,
  getCardsByCustomer: (customerId: string) => _cards.filter((c) => c.customerId === customerId),
  createCard: (data: Omit<Card, 'id' | 'createdAt' | 'status' | 'currentBalance' | 'maskedPan'>): Card => {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const card: Card = {
      ...data,
      id: genId('card'),
      maskedPan: `****-****-****-${last4}`,
      status: 'PENDING',
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };
    _cards = [..._cards, card];
    return card;
  },
  updateCard: (id: string, patch: Partial<Card>): Card | null => {
    const idx = _cards.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    _cards[idx] = { ..._cards[idx], ...patch };
    _cards = [..._cards];
    return _cards[idx];
  },

  // Batches
  getBatches: () => [..._batches],
  addBatch: (fileName: string): CustomerBatch => {
    const batch: CustomerBatch = { id: genId('batch'), fileName, status: 'UPLOADED', createdAt: new Date().toISOString() };
    _batches = [..._batches, batch];
    return batch;
  },

  // CMS Action Records
  addCMSAction: (record: Omit<CMSActionRecord, 'id' | 'createdAt'>): CMSActionRecord => {
    const entry: CMSActionRecord = { ...record, id: genId('cms'), createdAt: new Date().toISOString() };
    _cmsActions = [entry, ..._cmsActions];
    return entry;
  },
  getCMSActions: (entityType?: string, entityId?: string) => {
    let results = [..._cmsActions];
    if (entityType) results = results.filter(a => a.entityType === entityType);
    if (entityId) results = results.filter(a => a.entityId === entityId);
    return results;
  },

  // Pending CMS Requests (for customer creation)
  addPendingCMSRequest: (customerId: string, payload: Record<string, any>): PendingCMSRequest => {
    const req: PendingCMSRequest = { id: genId('pcms'), customerId, payload, createdAt: new Date().toISOString() };
    _pendingCmsRequests = [req, ..._pendingCmsRequests];
    return req;
  },
  getPendingCMSRequests: (customerId?: string) => {
    if (customerId) return _pendingCmsRequests.filter(r => r.customerId === customerId);
    return [..._pendingCmsRequests];
  },

  // Lookups
  getRoles: () => ROLES,
  getCardProducts: () => CARD_PRODUCTS,
  getIssuingBanks: () => ISSUING_BANKS,
};
