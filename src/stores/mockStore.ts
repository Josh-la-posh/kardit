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
  issuingBankName: string;
  status: CardStatus;
  currency: string;
  currentBalance: number;
  createdAt: string;
}

export type BatchStatus = 'UPLOADED' | 'VALIDATING' | 'VALIDATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface CustomerBatch {
  id: string;
  fileName: string;
  status: BatchStatus;
  totalRecords?: number;
  createdAt: string;
}

// ─── Seed Data ───────────────────────────────────────────────

export const ROLES: Role[] = [
  { id: 'r1', name: 'Admin', description: 'Full system access' },
  { id: 'r2', name: 'Operator', description: 'Day-to-day operations' },
  { id: 'r3', name: 'Analyst', description: 'View reports and analytics' },
  { id: 'r4', name: 'Compliance', description: 'Compliance and audit access' },
];

export const CARD_PRODUCTS = [
  { id: 'cp1', name: 'Kardit Classic' },
  { id: 'cp2', name: 'Kardit Gold' },
  { id: 'cp3', name: 'Kardit Platinum' },
  { id: 'cp4', name: 'Kardit Corporate' },
];

export const ISSUING_BANKS = [
  { id: 'ib1', name: 'Alpha Bank' },
  { id: 'ib2', name: 'Beta Financial' },
  { id: 'ib3', name: 'Gamma Trust' },
];

let _users: ManagedUser[] = [
  {
    id: 'u1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@alphabank.com',
    phone: '+1-555-0101',
    status: 'ACTIVE',
    roles: [ROLES[0]],
    lastLoginAt: '2026-02-06T10:30:00Z',
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: 'u2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@alphabank.com',
    phone: '+1-555-0102',
    status: 'ACTIVE',
    roles: [ROLES[1]],
    lastLoginAt: '2026-02-05T14:20:00Z',
    createdAt: '2024-06-20T11:00:00Z',
  },
  {
    id: 'u3',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.c@alphabank.com',
    status: 'INVITED',
    roles: [ROLES[2]],
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'u4',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    email: 'emily.r@alphabank.com',
    status: 'LOCKED',
    roles: [ROLES[1], ROLES[3]],
    lastLoginAt: '2026-01-28T16:45:00Z',
    createdAt: '2025-03-12T10:00:00Z',
  },
  {
    id: 'u5',
    firstName: 'David',
    lastName: 'Kim',
    email: 'fail-invite@kardit.app',
    status: 'DISABLED',
    roles: [ROLES[2]],
    createdAt: '2025-08-01T09:00:00Z',
  },
];

let _customers: Customer[] = [
  {
    id: 'c1', customerId: 'CUS-10001',
    firstName: 'Alice', lastName: 'Williams',
    email: 'alice.w@example.com', phone: '+1-555-1001',
    status: 'ACTIVE', createdAt: '2025-03-15T10:00:00Z',
    dateOfBirth: '1990-05-12', nationality: 'US',
    idType: 'Passport', idNumber: 'P1234567', idExpiryDate: '2030-05-12',
    address: { line1: '123 Main St', city: 'New York', state: 'NY', country: 'US', postalCode: '10001' },
  },
  {
    id: 'c2', customerId: 'CUS-10002',
    firstName: 'Bob', lastName: 'Martinez',
    email: 'bob.m@example.com', phone: '+1-555-1002',
    status: 'PENDING', createdAt: '2026-01-20T14:00:00Z',
    dateOfBirth: '1985-11-03', nationality: 'MX',
    idType: 'National ID', idNumber: 'NID987654', idExpiryDate: '2028-11-03',
    address: { line1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'US', postalCode: '90001' },
  },
  {
    id: 'c3', customerId: 'CUS-10003',
    firstName: 'Clara', lastName: 'Nguyen',
    email: 'clara.n@example.com',
    status: 'ACTIVE', createdAt: '2025-07-08T09:00:00Z',
    dateOfBirth: '1992-08-25', nationality: 'VN',
    idType: 'Passport', idNumber: 'P7654321', idExpiryDate: '2029-08-25',
    address: { line1: '789 Pine Rd', city: 'Houston', state: 'TX', country: 'US', postalCode: '77001' },
  },
  {
    id: 'c4', customerId: 'CUS-10004',
    firstName: 'Daniel', lastName: 'Okafor',
    email: 'daniel.o@example.com', phone: '+44-20-7946-0958',
    status: 'REJECTED', createdAt: '2026-01-05T08:00:00Z',
    dateOfBirth: '1988-02-14', nationality: 'NG',
    idType: 'Driver License', idNumber: 'DL-456789', idExpiryDate: '2027-02-14',
  },
  {
    id: 'c5', customerId: 'CUS-10005',
    firstName: 'Eva', lastName: 'Schmidt',
    email: 'eva.s@example.com', phone: '+49-30-12345678',
    status: 'ACTIVE', createdAt: '2025-11-22T12:00:00Z',
    dateOfBirth: '1995-06-30', nationality: 'DE',
    idType: 'National ID', idNumber: 'DE-ID-112233', idExpiryDate: '2031-06-30',
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
  { id: 'card1', customerId: 'c1', maskedPan: '****-****-****-4532', productName: 'Kardit Gold', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 2450.00, createdAt: '2025-03-16T09:00:00Z' },
  { id: 'card2', customerId: 'c1', maskedPan: '****-****-****-7891', productName: 'Kardit Classic', issuingBankName: 'Alpha Bank', status: 'FROZEN', currency: 'USD', currentBalance: 150.75, createdAt: '2025-06-01T10:00:00Z' },
  { id: 'card3', customerId: 'c2', maskedPan: '****-****-****-3344', productName: 'Kardit Classic', issuingBankName: 'Beta Financial', status: 'PENDING', currency: 'USD', currentBalance: 0, createdAt: '2026-01-20T15:00:00Z' },
  { id: 'card4', customerId: 'c3', maskedPan: '****-****-****-5566', productName: 'Kardit Platinum', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 12300.00, createdAt: '2025-07-09T11:00:00Z' },
  { id: 'card5', customerId: 'c3', maskedPan: '****-****-****-9988', productName: 'Kardit Corporate', issuingBankName: 'Gamma Trust', status: 'ACTIVE', currency: 'EUR', currentBalance: 8500.00, createdAt: '2025-09-15T08:00:00Z' },
  { id: 'card6', customerId: 'c5', maskedPan: '****-****-****-2211', productName: 'Kardit Gold', issuingBankName: 'Gamma Trust', status: 'BLOCKED', currency: 'EUR', currentBalance: 320.50, createdAt: '2025-12-01T14:00:00Z' },
];

let _batches: CustomerBatch[] = [
  { id: 'batch1', fileName: 'customers_jan_2026.csv', status: 'COMPLETED', totalRecords: 150, createdAt: '2026-01-15T09:00:00Z' },
  { id: 'batch2', fileName: 'customers_feb_2026.csv', status: 'PROCESSING', totalRecords: 85, createdAt: '2026-02-01T10:00:00Z' },
  { id: 'batch3', fileName: 'customers_onboard.csv', status: 'FAILED', totalRecords: 42, createdAt: '2026-02-03T11:00:00Z' },
];

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

  // Lookups
  getRoles: () => ROLES,
  getCardProducts: () => CARD_PRODUCTS,
  getIssuingBanks: () => ISSUING_BANKS,
};
