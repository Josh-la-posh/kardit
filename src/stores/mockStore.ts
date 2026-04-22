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
  tenantId: string;
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

export type CustomerStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';

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
  tenantId: string;
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
  tenantId: string;
  customerId: string;
  type: 'ID_FRONT' | 'ID_BACK' | 'PROOF_OF_ADDRESS' | string;
  status: KycDocumentStatus;
  fileName: string;
  uploadedAt: string;
}

export type CardStatus = 'PENDING' | 'PENDING_ACTIVATION' | 'ACTIVE' | 'FROZEN' | 'BLOCKED' | 'TERMINATED' | 'PERSONALIZING';

export interface Card {
  id: string;
  tenantId: string;
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
  tenantId: string;
  fileName: string;
  status: BatchStatus;
  totalRecords?: number;
  createdAt: string;
}

// ─── Platform Banks & Affiliates (Super Admin View) ─────────

export type PlatformBankStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface PlatformBank {
  id: string;
  name: string;
  code: string;
  country: string;
  status: PlatformBankStatus;
  contactEmail: string;
  contactPhone?: string;
  totalAffiliates: number;
  totalCustomers: number;
  totalCards: number;
  createdAt: string;
}

export type PlatformAffiliateStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';

export interface PlatformAffiliate {
  id: string;
  bankId: string;
  name: string;
  registrationNumber: string;
  country: string;
  status: PlatformAffiliateStatus;
  contactEmail: string;
  contactName: string;
  contactPhone?: string;
  totalCustomers: number;
  totalCards: number;
  createdAt: string;
  provisionedAt?: string;
}

// ─── Issuing Banks (Service Provider) ────────────────────────

export type IssuingBankSessionStatus = 'DRAFT' | 'SUBMITTED' | 'PROVISIONING' | 'PROVISIONED' | 'FAILED';

export interface IssuingBankDetails {
  name: string;
  shortName: string;
  code: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  bankAddress?: string;
  additionalInfo?: string;
  // bankId?: string; 
  // status?: string;
  // provisionedAt?: string;
  
}

export interface IssuingBankSession {
  sessionId: string;
  tenantId: string;
  status: IssuingBankSessionStatus;
  bankDetails: IssuingBankDetails;
  bankId?: string;
  internalAffiliate?: {
    affiliateId: string;
    affiliateType: string;
    ownerBankId: string;
    status: string;
    isSystemManaged: boolean;
    legalName?: string;
    shortName?: string;
  };
  internalPartnership?: {
    partnershipRequestId: string;
    status: string;
  };
  provisioningProgress?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssuingBank extends IssuingBankSession {
  id: string;
  provisionedAt?: string;
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
  { id: 'nin', label: 'National Identification Number (NIN)', code: 'NIN' },
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
  L: { label: 'Suspend', targetStatus: 'FROZEN' as CardStatus },
  U: { label: 'Activate', targetStatus: 'ACTIVE' as CardStatus },
  P: { label: 'Terminate', targetStatus: 'BLOCKED' as CardStatus },
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
    tenantId: 'tenant_alpha_affiliate',
    id: 'u1', firstName: 'John', lastName: 'Doe', email: 'admin@alphabank.com', phone: '+1-555-0101',
    status: 'ACTIVE', roles: [ROLES[0]], lastLoginAt: '2026-02-06T10:30:00Z', createdAt: '2024-01-15T09:00:00Z',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'u2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@alphabank.com', phone: '+1-555-0102',
    status: 'ACTIVE', roles: [ROLES[1]], lastLoginAt: '2026-02-05T14:20:00Z', createdAt: '2024-06-20T11:00:00Z',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'u3', firstName: 'Mike', lastName: 'Chen', email: 'mike.c@alphabank.com',
    status: 'INVITED', roles: [ROLES[2]], createdAt: '2026-01-10T08:00:00Z',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'u4', firstName: 'Emily', lastName: 'Rodriguez', email: 'emily.r@alphabank.com',
    status: 'LOCKED', roles: [ROLES[1], ROLES[3]], lastLoginAt: '2026-01-28T16:45:00Z', createdAt: '2025-03-12T10:00:00Z',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'u5', firstName: 'David', lastName: 'Kim', email: 'fail-invite@kardit.app',
    status: 'DISABLED', roles: [ROLES[2]], createdAt: '2025-08-01T09:00:00Z',
  },
];

let _customers: Customer[] = [
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'c1', customerId: 'CUS-10001', firstName: 'Alice', lastName: 'Williams', embossName: 'ALICE WILLIAMS',
    email: 'alice.w@example.com', phone: '+1-555-1001', status: 'ACTIVE', createdAt: '2025-03-15T10:00:00Z',
    dateOfBirth: '1990-05-12', nationality: 'US', idType: 'passport', idNumber: 'P1234567', idExpiryDate: '2030-05-12',
    address: { line1: '123 Main St', city: 'New York', state: 'NY', country: 'US', postalCode: '10001' },
    rib: '1234567890123456789012', agencyCode: 'AG001',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'c2', customerId: 'CUS-10002', firstName: 'Bob', lastName: 'Martinez', embossName: 'BOB MARTINEZ',
    email: 'bob.m@example.com', phone: '+1-555-1002', status: 'PENDING', createdAt: '2026-01-20T14:00:00Z',
    dateOfBirth: '1985-11-03', nationality: 'MX', idType: 'national_id', idNumber: 'NID987654', idExpiryDate: '2028-11-03',
    address: { line1: '456 Oak Ave', city: 'Los Angeles', state: 'CA', country: 'US', postalCode: '90001' },
    rib: '9876543210987654321098', agencyCode: 'AG002',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'c3', customerId: 'CUS-10003', firstName: 'Clara', lastName: 'Nguyen', embossName: 'CLARA NGUYEN',
    email: 'clara.n@example.com', status: 'ACTIVE', createdAt: '2025-07-08T09:00:00Z',
    dateOfBirth: '1992-08-25', nationality: 'VN', idType: 'passport', idNumber: 'P7654321', idExpiryDate: '2029-08-25',
    address: { line1: '789 Pine Rd', city: 'Houston', state: 'TX', country: 'US', postalCode: '77001' },
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'c4', customerId: 'CUS-10004', firstName: 'Daniel', lastName: 'Okafor',
    email: 'daniel.o@example.com', phone: '+44-20-7946-0958', status: 'REJECTED', createdAt: '2026-01-05T08:00:00Z',
    dateOfBirth: '1988-02-14', nationality: 'NG', idType: 'driver_license', idNumber: 'DL-456789', idExpiryDate: '2027-02-14',
  },
  {
    tenantId: 'tenant_alpha_affiliate',
    id: 'c5', customerId: 'CUS-10005', firstName: 'Eva', lastName: 'Schmidt', embossName: 'EVA SCHMIDT',
    email: 'eva.s@example.com', phone: '+49-30-12345678', status: 'ACTIVE', createdAt: '2025-11-22T12:00:00Z',
    dateOfBirth: '1995-06-30', nationality: 'DE', idType: 'national_id', idNumber: 'DE-ID-112233', idExpiryDate: '2031-06-30',
    address: { line1: '10 Berliner Str', city: 'Berlin', country: 'DE', postalCode: '10115' },
  },
  // Bank portfolio customers
  {
    tenantId: 'tenant_alpha_bank',
    id: 'c6', customerId: 'CUS-10006', firstName: 'Kofi', lastName: 'Mensah', embossName: 'KOFI MENSAH',
    email: 'kofi.m@example.com', phone: '+233-55-1234567', status: 'ACTIVE', createdAt: '2025-10-10T10:00:00Z',
    dateOfBirth: '1990-03-15', nationality: 'GH', idType: 'national_id', idNumber: 'GH-NID-234567', idExpiryDate: '2030-03-15',
    address: { line1: '123 Gold St', city: 'Accra', country: 'GH', postalCode: 'GA-001' },
    rib: '2345678901234567890123', agencyCode: 'AG003',
  },
  {
    tenantId: 'tenant_alpha_bank',
    id: 'c7', customerId: 'CUS-10007', firstName: 'Zainab', lastName: 'Hassan', embossName: 'ZAINAB HASSAN',
    email: 'zainab.h@example.com', phone: '+234-803-9876543', status: 'ACTIVE', createdAt: '2025-09-05T14:00:00Z',
    dateOfBirth: '1993-07-22', nationality: 'NG', idType: 'passport', idNumber: 'P3456789', idExpiryDate: '2028-07-22',
    address: { line1: '456 Trade Ave', city: 'Lagos', state: 'LA', country: 'NG', postalCode: 'LG-100' },
    rib: '3456789012345678901234', agencyCode: 'AG004',
  },
  {
    tenantId: 'tenant_alpha_bank',
    id: 'c8', customerId: 'CUS-10008', firstName: 'Amara', lastName: 'Diallo', embossName: 'AMARA DIALLO',
    email: 'amara.d@example.com', phone: '+221-77-1234567', status: 'ACTIVE', createdAt: '2025-12-01T11:00:00Z',
    dateOfBirth: '1988-11-08', nationality: 'SN', idType: 'national_id', idNumber: 'SN-ID-345678', idExpiryDate: '2029-11-08',
    address: { line1: '789 Commercial Rd', city: 'Dakar', country: 'SN', postalCode: 'DSK-110' },
    rib: '4567890123456789012345', agencyCode: 'AG005',
  },
  {
    tenantId: 'tenant_alpha_bank',
    id: 'c9', customerId: 'CUS-10009', firstName: 'Ibrahim', lastName: 'Sow', embossName: 'IBRAHIM SOW',
    email: 'ibrahim.s@example.com', phone: '+224-610-234567', status: 'PENDING', createdAt: '2026-02-15T09:00:00Z',
    dateOfBirth: '1992-05-19', nationality: 'GN', idType: 'passport', idNumber: 'P4567890', idExpiryDate: '2027-05-19',
    address: { line1: '321 Market St', city: 'Conakry', country: 'GN', postalCode: 'CKY-201' },
  },
  {
    tenantId: 'tenant_alpha_bank',
    id: 'c10', customerId: 'CUS-10010', firstName: 'Nia', lastName: 'Okoro', embossName: 'NIA OKORO',
    email: 'nia.o@example.com', phone: '+234-702-5678901', status: 'ACTIVE', createdAt: '2025-08-20T15:30:00Z',
    dateOfBirth: '1994-09-12', nationality: 'NG', idType: 'driver_license', idNumber: 'DL-567890', idExpiryDate: '2026-09-12',
    address: { line1: '654 Business Plaza', city: 'Abuja', state: 'FCT', country: 'NG', postalCode: 'ABJ-900' },
    rib: '5678901234567890123456', agencyCode: 'AG006',
  },
  {
    tenantId: 'tenant_alpha_bank',
    id: 'c11', customerId: 'CUS-10011', firstName: 'Kwame', lastName: 'Asante', embossName: 'KWAME ASANTE',
    email: 'kwame.a@example.com', phone: '+233-24-1234567', status: 'ACTIVE', createdAt: '2025-11-03T12:00:00Z',
    dateOfBirth: '1991-01-25', nationality: 'GH', idType: 'national_id', idNumber: 'GH-NID-456789', idExpiryDate: '2031-01-25',
    address: { line1: '987 Financial Center', city: 'Kumasi', country: 'GH', postalCode: 'KM-050' },
    rib: '6789012345678901234567', agencyCode: 'AG007',
  },
];

let _kycDocuments: KycDocument[] = [
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc1', customerId: 'c1', type: 'ID_FRONT', status: 'VERIFIED', fileName: 'alice_passport_front.jpg', uploadedAt: '2025-03-15T10:05:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc2', customerId: 'c1', type: 'ID_BACK', status: 'VERIFIED', fileName: 'alice_passport_back.jpg', uploadedAt: '2025-03-15T10:06:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc3', customerId: 'c1', type: 'PROOF_OF_ADDRESS', status: 'VERIFIED', fileName: 'alice_utility_bill.pdf', uploadedAt: '2025-03-15T10:07:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc4', customerId: 'c2', type: 'ID_FRONT', status: 'UPLOADED', fileName: 'bob_id_front.jpg', uploadedAt: '2026-01-20T14:10:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc5', customerId: 'c3', type: 'ID_FRONT', status: 'VERIFIED', fileName: 'clara_passport.jpg', uploadedAt: '2025-07-08T09:10:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc6', customerId: 'c3', type: 'PROOF_OF_ADDRESS', status: 'REJECTED', fileName: 'clara_bank_stmt.pdf', uploadedAt: '2025-07-08T09:12:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'kyc7', customerId: 'c4', type: 'ID_FRONT', status: 'REJECTED', fileName: 'daniel_dl_front.jpg', uploadedAt: '2026-01-05T08:05:00Z' },
];

let _cards: Card[] = [
  { tenantId: 'tenant_alpha_affiliate', id: 'card1', customerId: 'c1', maskedPan: '****-****-****-4532', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 2450.00, createdAt: '2025-03-16T09:00:00Z', embossName: 'ALICE WILLIAMS', deliveryMethod: 'BRANCH_PICKUP' },
  { tenantId: 'tenant_alpha_affiliate', id: 'card2', customerId: 'c1', maskedPan: '****-****-****-7891', productName: 'Kardit Classic', productCode: 'KRD_CLS', issuingBankName: 'Alpha Bank', status: 'FROZEN', currency: 'USD', currentBalance: 150.75, createdAt: '2025-06-01T10:00:00Z', embossName: 'ALICE WILLIAMS', deliveryMethod: 'HOME_DELIVERY' },
  { tenantId: 'tenant_alpha_affiliate', id: 'card3', customerId: 'c2', maskedPan: '****-****-****-3344', productName: 'Kardit Classic', productCode: 'KRD_CLS', issuingBankName: 'Beta Financial', status: 'PENDING', currency: 'USD', currentBalance: 0, createdAt: '2026-01-20T15:00:00Z', embossName: 'BOB MARTINEZ' },
  { tenantId: 'tenant_alpha_affiliate', id: 'card4', customerId: 'c3', maskedPan: '****-****-****-5566', productName: 'Kardit Platinum', productCode: 'KRD_PLT', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 12300.00, createdAt: '2025-07-09T11:00:00Z', embossName: 'CLARA NGUYEN' },
  { tenantId: 'tenant_alpha_affiliate', id: 'card5', customerId: 'c3', maskedPan: '****-****-****-9988', productName: 'Kardit Corporate', productCode: 'KRD_CRP', issuingBankName: 'Gamma Trust', status: 'ACTIVE', currency: 'EUR', currentBalance: 8500.00, createdAt: '2025-09-15T08:00:00Z', embossName: 'CLARA NGUYEN' },
  { tenantId: 'tenant_alpha_affiliate', id: 'card6', customerId: 'c5', maskedPan: '****-****-****-2211', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Gamma Trust', status: 'BLOCKED', currency: 'EUR', currentBalance: 320.50, createdAt: '2025-12-01T14:00:00Z', embossName: 'EVA SCHMIDT' },
  // Bank portfolio cards
  { tenantId: 'tenant_alpha_bank', id: 'card7', customerId: 'c6', maskedPan: '****-****-****-6789', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 3500.00, createdAt: '2025-10-11T10:00:00Z', embossName: 'KOFI MENSAH', deliveryMethod: 'BRANCH_PICKUP' },
  { tenantId: 'tenant_alpha_bank', id: 'card8', customerId: 'c7', maskedPan: '****-****-****-1357', productName: 'Kardit Platinum', productCode: 'KRD_PLT', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 15000.00, createdAt: '2025-09-06T14:00:00Z', embossName: 'ZAINAB HASSAN', deliveryMethod: 'HOME_DELIVERY' },
  { tenantId: 'tenant_alpha_bank', id: 'card9', customerId: 'c7', maskedPan: '****-****-****-2468', productName: 'Kardit Classic', productCode: 'KRD_CLS', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 2200.00, createdAt: '2025-10-06T14:00:00Z', embossName: 'ZAINAB HASSAN', deliveryMethod: 'HOME_DELIVERY' },
  { tenantId: 'tenant_alpha_bank', id: 'card10', customerId: 'c8', maskedPan: '****-****-****-3579', productName: 'Kardit Corporate', productCode: 'KRD_CRP', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'EUR', currentBalance: 8800.00, createdAt: '2025-12-02T11:00:00Z', embossName: 'AMARA DIALLO', deliveryMethod: 'BRANCH_PICKUP' },
  { tenantId: 'tenant_alpha_bank', id: 'card11', customerId: 'c9', maskedPan: '****-****-****-4680', productName: 'Kardit Classic', productCode: 'KRD_CLS', issuingBankName: 'Alpha Bank', status: 'PENDING', currency: 'USD', currentBalance: 0, createdAt: '2026-02-16T09:00:00Z', embossName: 'IBRAHIM SOW' },
  { tenantId: 'tenant_alpha_bank', id: 'card12', customerId: 'c10', maskedPan: '****-****-****-5791', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 5600.00, createdAt: '2025-08-21T15:30:00Z', embossName: 'NIA OKORO', deliveryMethod: 'HOME_DELIVERY' },
  { tenantId: 'tenant_alpha_bank', id: 'card13', customerId: 'c11', maskedPan: '****-****-****-6902', productName: 'Kardit Gold', productCode: 'KRD_GLD', issuingBankName: 'Alpha Bank', status: 'ACTIVE', currency: 'USD', currentBalance: 4100.00, createdAt: '2025-11-04T12:00:00Z', embossName: 'KWAME ASANTE', deliveryMethod: 'BRANCH_PICKUP' },
];

let _batches: CustomerBatch[] = [
  { tenantId: 'tenant_alpha_affiliate', id: 'batch1', fileName: 'customers_jan_2026.csv', status: 'COMPLETED', totalRecords: 150, createdAt: '2026-01-15T09:00:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'batch2', fileName: 'customers_feb_2026.csv', status: 'PROCESSING', totalRecords: 85, createdAt: '2026-02-01T10:00:00Z' },
  { tenantId: 'tenant_alpha_affiliate', id: 'batch3', fileName: 'customers_onboard.csv', status: 'FAILED', totalRecords: 42, createdAt: '2026-02-03T11:00:00Z' },
];

// ─── Issuing Bank Sessions (Service Provider) ─────────────────

let _issuingBankSessions: IssuingBankSession[] = [];
let _issuingBanks: IssuingBank[] = [];

// ─── Platform Banks Seed Data (Super Admin View) ─────────────

const _platformBanks: PlatformBank[] = [
  {
    id: 'bank_alpha',
    name: 'Alpha Bank',
    code: 'ALPHA',
    country: 'US',
    status: 'ACTIVE',
    contactEmail: 'admin@alphabank.com',
    contactPhone: '+1-555-0100',
    totalAffiliates: 3,
    totalCustomers: 450,
    totalCards: 820,
    createdAt: '2023-06-15T09:00:00Z',
  },
  {
    id: 'bank_beta',
    name: 'Beta Financial',
    code: 'BETA',
    country: 'UK',
    status: 'ACTIVE',
    contactEmail: 'contact@betafinancial.co.uk',
    contactPhone: '+44-20-7946-0000',
    totalAffiliates: 2,
    totalCustomers: 280,
    totalCards: 510,
    createdAt: '2023-09-20T10:00:00Z',
  },
  {
    id: 'bank_gamma',
    name: 'Gamma Trust',
    code: 'GAMMA',
    country: 'DE',
    status: 'ACTIVE',
    contactEmail: 'info@gammatrust.de',
    contactPhone: '+49-30-1234567',
    totalAffiliates: 4,
    totalCustomers: 680,
    totalCards: 1150,
    createdAt: '2024-01-10T08:00:00Z',
  },
  {
    id: 'bank_delta',
    name: 'Delta Credit Union',
    code: 'DELTA',
    country: 'CA',
    status: 'SUSPENDED',
    contactEmail: 'support@deltacu.ca',
    contactPhone: '+1-416-555-0199',
    totalAffiliates: 1,
    totalCustomers: 95,
    totalCards: 120,
    createdAt: '2024-03-05T11:00:00Z',
  },
  {
    id: 'bank_epsilon',
    name: 'Epsilon Bank',
    code: 'EPSILON',
    country: 'FR',
    status: 'INACTIVE',
    contactEmail: 'contact@epsilonbank.fr',
    totalAffiliates: 0,
    totalCustomers: 0,
    totalCards: 0,
    createdAt: '2025-01-20T14:00:00Z',
  },
];

const _platformAffiliates: PlatformAffiliate[] = [
  // Alpha Bank affiliates
  {
    id: 'aff_alpha_1',
    bankId: 'bank_alpha',
    name: 'Alpha Payments LLC',
    registrationNumber: 'US-LLC-12345',
    country: 'US',
    status: 'ACTIVE',
    contactEmail: 'admin@alphapayments.com',
    contactName: 'John Smith',
    contactPhone: '+1-555-0101',
    totalCustomers: 180,
    totalCards: 320,
    createdAt: '2023-08-10T09:00:00Z',
    provisionedAt: '2023-08-15T10:00:00Z',
  },
  {
    id: 'aff_alpha_2',
    bankId: 'bank_alpha',
    name: 'FastCard Solutions',
    registrationNumber: 'US-INC-67890',
    country: 'US',
    status: 'ACTIVE',
    contactEmail: 'ops@fastcard.io',
    contactName: 'Sarah Johnson',
    contactPhone: '+1-555-0102',
    totalCustomers: 150,
    totalCards: 280,
    createdAt: '2024-01-20T11:00:00Z',
    provisionedAt: '2024-01-25T14:00:00Z',
  },
  {
    id: 'aff_alpha_3',
    bankId: 'bank_alpha',
    name: 'PayQuick Corp',
    registrationNumber: 'US-CORP-11223',
    country: 'US',
    status: 'PENDING',
    contactEmail: 'onboarding@payquick.com',
    contactName: 'Mike Chen',
    totalCustomers: 120,
    totalCards: 220,
    createdAt: '2025-11-01T08:00:00Z',
  },
  // Beta Financial affiliates
  {
    id: 'aff_beta_1',
    bankId: 'bank_beta',
    name: 'UK Card Services Ltd',
    registrationNumber: 'UK-LTD-44556',
    country: 'UK',
    status: 'ACTIVE',
    contactEmail: 'hello@ukcardservices.co.uk',
    contactName: 'James Wilson',
    contactPhone: '+44-20-7946-0001',
    totalCustomers: 200,
    totalCards: 380,
    createdAt: '2023-11-05T10:00:00Z',
    provisionedAt: '2023-11-10T12:00:00Z',
  },
  {
    id: 'aff_beta_2',
    bankId: 'bank_beta',
    name: 'Euro Prepaid GmbH',
    registrationNumber: 'DE-GMBH-77889',
    country: 'DE',
    status: 'SUSPENDED',
    contactEmail: 'contact@europrepaid.de',
    contactName: 'Anna Mueller',
    contactPhone: '+49-30-9876543',
    totalCustomers: 80,
    totalCards: 130,
    createdAt: '2024-05-15T09:00:00Z',
    provisionedAt: '2024-05-20T11:00:00Z',
  },
  // Gamma Trust affiliates
  {
    id: 'aff_gamma_1',
    bankId: 'bank_gamma',
    name: 'Deutsche Karten AG',
    registrationNumber: 'DE-AG-99001',
    country: 'DE',
    status: 'ACTIVE',
    contactEmail: 'info@deutschekarten.de',
    contactName: 'Hans Schmidt',
    contactPhone: '+49-89-1234567',
    totalCustomers: 250,
    totalCards: 450,
    createdAt: '2024-02-01T08:00:00Z',
    provisionedAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'aff_gamma_2',
    bankId: 'bank_gamma',
    name: 'Nordic Pay AB',
    registrationNumber: 'SE-AB-22334',
    country: 'SE',
    status: 'ACTIVE',
    contactEmail: 'support@nordicpay.se',
    contactName: 'Erik Lindgren',
    contactPhone: '+46-8-1234567',
    totalCustomers: 180,
    totalCards: 300,
    createdAt: '2024-04-10T09:00:00Z',
    provisionedAt: '2024-04-15T11:00:00Z',
  },
  {
    id: 'aff_gamma_3',
    bankId: 'bank_gamma',
    name: 'Swiss Card SA',
    registrationNumber: 'CH-SA-55667',
    country: 'CH',
    status: 'ACTIVE',
    contactEmail: 'admin@swisscard.ch',
    contactName: 'Pierre Dubois',
    contactPhone: '+41-22-1234567',
    totalCustomers: 150,
    totalCards: 250,
    createdAt: '2024-06-20T10:00:00Z',
    provisionedAt: '2024-06-25T12:00:00Z',
  },
  {
    id: 'aff_gamma_4',
    bankId: 'bank_gamma',
    name: 'Austrian Prepaid KG',
    registrationNumber: 'AT-KG-88990',
    country: 'AT',
    status: 'INACTIVE',
    contactEmail: 'office@atprepaid.at',
    contactName: 'Wolfgang Bauer',
    totalCustomers: 100,
    totalCards: 150,
    createdAt: '2024-08-01T08:00:00Z',
  },
  // Delta Credit Union affiliate
  {
    id: 'aff_delta_1',
    bankId: 'bank_delta',
    name: 'Maple Leaf Cards Inc',
    registrationNumber: 'CA-INC-33445',
    country: 'CA',
    status: 'SUSPENDED',
    contactEmail: 'info@mapleleafcards.ca',
    contactName: 'David Thompson',
    contactPhone: '+1-416-555-0200',
    totalCustomers: 95,
    totalCards: 120,
    createdAt: '2024-04-01T09:00:00Z',
    provisionedAt: '2024-04-05T10:00:00Z',
  },
];

// ─── Affiliate Customers (for Super Admin drill-down) ────────

const _affiliateCustomers: Record<string, Customer[]> = {
  'aff_alpha_1': [
    { tenantId: 'aff_alpha_1', id: 'ac1', customerId: 'CUS-A1-001', firstName: 'Robert', lastName: 'Brown', embossName: 'ROBERT BROWN', email: 'robert.b@email.com', phone: '+1-555-2001', status: 'ACTIVE', createdAt: '2024-01-10T10:00:00Z' },
    { tenantId: 'aff_alpha_1', id: 'ac2', customerId: 'CUS-A1-002', firstName: 'Lisa', lastName: 'Taylor', embossName: 'LISA TAYLOR', email: 'lisa.t@email.com', phone: '+1-555-2002', status: 'ACTIVE', createdAt: '2024-02-15T11:00:00Z' },
    { tenantId: 'aff_alpha_1', id: 'ac3', customerId: 'CUS-A1-003', firstName: 'Michael', lastName: 'Davis', embossName: 'MICHAEL DAVIS', email: 'michael.d@email.com', status: 'PENDING', createdAt: '2025-12-01T09:00:00Z' },
    { tenantId: 'aff_alpha_1', id: 'ac4', customerId: 'CUS-A1-004', firstName: 'Jennifer', lastName: 'Wilson', embossName: 'JENNIFER WILSON', email: 'jennifer.w@email.com', phone: '+1-555-2004', status: 'ACTIVE', createdAt: '2024-05-20T14:00:00Z' },
    { tenantId: 'aff_alpha_1', id: 'ac5', customerId: 'CUS-A1-005', firstName: 'William', lastName: 'Moore', email: 'william.m@email.com', status: 'REJECTED', createdAt: '2025-10-10T08:00:00Z' },
  ],
  'aff_alpha_2': [
    { tenantId: 'aff_alpha_2', id: 'ac6', customerId: 'CUS-A2-001', firstName: 'Jessica', lastName: 'Anderson', embossName: 'JESSICA ANDERSON', email: 'jessica.a@email.com', phone: '+1-555-3001', status: 'ACTIVE', createdAt: '2024-03-01T10:00:00Z' },
    { tenantId: 'aff_alpha_2', id: 'ac7', customerId: 'CUS-A2-002', firstName: 'Christopher', lastName: 'Thomas', embossName: 'CHRISTOPHER THOMAS', email: 'chris.t@email.com', phone: '+1-555-3002', status: 'ACTIVE', createdAt: '2024-04-10T11:00:00Z' },
    { tenantId: 'aff_alpha_2', id: 'ac8', customerId: 'CUS-A2-003', firstName: 'Amanda', lastName: 'Jackson', email: 'amanda.j@email.com', status: 'PENDING', createdAt: '2025-11-20T09:00:00Z' },
  ],
  'aff_beta_1': [
    { tenantId: 'aff_beta_1', id: 'bc1', customerId: 'CUS-B1-001', firstName: 'Oliver', lastName: 'Smith', embossName: 'OLIVER SMITH', email: 'oliver.s@email.co.uk', phone: '+44-20-5551001', status: 'ACTIVE', createdAt: '2024-01-15T10:00:00Z' },
    { tenantId: 'aff_beta_1', id: 'bc2', customerId: 'CUS-B1-002', firstName: 'Emily', lastName: 'Jones', embossName: 'EMILY JONES', email: 'emily.j@email.co.uk', phone: '+44-20-5551002', status: 'ACTIVE', createdAt: '2024-02-20T11:00:00Z' },
    { tenantId: 'aff_beta_1', id: 'bc3', customerId: 'CUS-B1-003', firstName: 'Harry', lastName: 'Williams', email: 'harry.w@email.co.uk', status: 'ACTIVE', createdAt: '2024-05-10T09:00:00Z' },
    { tenantId: 'aff_beta_1', id: 'bc4', customerId: 'CUS-B1-004', firstName: 'Isabella', lastName: 'Brown', embossName: 'ISABELLA BROWN', email: 'isabella.b@email.co.uk', phone: '+44-20-5551004', status: 'PENDING', createdAt: '2026-01-05T08:00:00Z' },
  ],
  'aff_gamma_1': [
    { tenantId: 'aff_gamma_1', id: 'gc1', customerId: 'CUS-G1-001', firstName: 'Maximilian', lastName: 'Weber', embossName: 'MAXIMILIAN WEBER', email: 'max.w@email.de', phone: '+49-89-5551001', status: 'ACTIVE', createdAt: '2024-03-01T10:00:00Z' },
    { tenantId: 'aff_gamma_1', id: 'gc2', customerId: 'CUS-G1-002', firstName: 'Sophie', lastName: 'Hoffmann', embossName: 'SOPHIE HOFFMANN', email: 'sophie.h@email.de', phone: '+49-89-5551002', status: 'ACTIVE', createdAt: '2024-04-15T11:00:00Z' },
    { tenantId: 'aff_gamma_1', id: 'gc3', customerId: 'CUS-G1-003', firstName: 'Felix', lastName: 'Fischer', email: 'felix.f@email.de', status: 'ACTIVE', createdAt: '2024-06-20T09:00:00Z' },
    { tenantId: 'aff_gamma_1', id: 'gc4', customerId: 'CUS-G1-004', firstName: 'Lena', lastName: 'Koch', embossName: 'LENA KOCH', email: 'lena.k@email.de', phone: '+49-89-5551004', status: 'REJECTED', createdAt: '2025-09-10T08:00:00Z' },
    { tenantId: 'aff_gamma_1', id: 'gc5', customerId: 'CUS-G1-005', firstName: 'Paul', lastName: 'Richter', email: 'paul.r@email.de', status: 'PENDING', createdAt: '2026-02-01T10:00:00Z' },
  ],
};

let _cmsActions: CMSActionRecord[] = [];
let _pendingCmsRequests: PendingCMSRequest[] = [];

let _nextId = 100;
const genId = (prefix: string) => `${prefix}${_nextId++}`;

// ─── Accessors & Mutators ────────────────────────────────────

export const store = {
      // CMS PIN Reset (Mock)
      resetCardPin: async (cardId: string): Promise<{ success: boolean; error?: string }> => {
        const card = store.getCard(cardId);
        if (!card) return { success: false, error: 'Card not found' };
        let success = false;
        let attempt = 0;
        let error = '';
        while (attempt < 3 && !success) {
          attempt++;
          // 20% chance of CMS failure per attempt
          if (Math.random() < 0.2) {
            error = 'CMS PIN reset failed';
            continue;
          }
          success = true;
        }
        store.addCMSAction({
          entityType: 'CARD',
          entityId: cardId,
          payload: { action: 'PIN_RESET', attempt, success, error: success ? undefined : error },
        });
        if (success) {
          // Simulate SMS delivery trigger (no-op, but could be logged)
          // Optionally, add a log or notification here
        }
        return { success, error: success ? undefined : error };
      },
    // CMS Balance Fetch (Mock)
    fetchCardBalanceFromCMS: async (cardId: string): Promise<{ success: boolean; balance: number; status: string; error?: string }> => {
      // Simulate network delay and random failure
      await new Promise(r => setTimeout(r, 700));
      const card = store.getCard(cardId);
      if (!card) return { success: false, balance: 0, status: 'UNKNOWN', error: 'Card not found' };
      // 25% chance CMS is unavailable
      if (Math.random() < 0.25) {
        return { success: false, balance: card.currentBalance, status: card.status, error: 'CMS unavailable' };
      }
      // Simulate CMS returning a slightly different balance
      const delta = Math.round((Math.random() - 0.5) * 200) / 100; // -1.00 to +1.00
      return { success: true, balance: Math.max(0, card.currentBalance + delta), status: card.status };
    },
  // Users
  getUsers: (tenantId?: string) => tenantId ? _users.filter((u) => u.tenantId === tenantId) : [..._users],
  getUser: (id: string, tenantId?: string) => {
    const u = _users.find((u) => u.id === id) || null;
    if (!u) return null;
    if (tenantId && u.tenantId !== tenantId) return null;
    return u;
  },
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
  getCustomers: (tenantId?: string) => tenantId ? _customers.filter((c) => c.tenantId === tenantId) : [..._customers],
  getCustomer: (id: string, tenantId?: string) => {
    const c = _customers.find((c) => c.id === id) || null;
    if (!c) return null;
    if (tenantId && c.tenantId !== tenantId) return null;
    return c;
  },
  createCustomer: (data: Omit<Customer, 'id' | 'customerId' | 'createdAt' | 'status'>): Customer => {
    const id = genId('c');
    const customer: Customer = {
      ...data,
      id,
      customerId: `CUS-${10000 + _nextId}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    _customers = [..._customers, customer];
    return customer;
  },
  updateCustomer: (id: string, patch: Partial<Customer>): Customer | null => {
    const idx = _customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    _customers[idx] = { ..._customers[idx], ...patch };
    _customers = [..._customers];
    return _customers[idx];
  },

  // KYC Documents
  getKycDocuments: (customerId: string, tenantId?: string) => {
    const docs = _kycDocuments.filter((d) => d.customerId === customerId);
    return tenantId ? docs.filter((d) => d.tenantId === tenantId) : docs;
  },
  addKycDocument: (doc: Omit<KycDocument, 'id' | 'uploadedAt'>): KycDocument => {
    const kycDoc: KycDocument = { ...doc, id: genId('kyc'), uploadedAt: new Date().toISOString() };
    _kycDocuments = [..._kycDocuments, kycDoc];
    return kycDoc;
  },

  // Cards
  getCards: (tenantId?: string) => tenantId ? _cards.filter((c) => c.tenantId === tenantId) : [..._cards],
  getCard: (id: string, tenantId?: string) => {
    const c = _cards.find((c) => c.id === id) || null;
    if (!c) return null;
    if (tenantId && c.tenantId !== tenantId) return null;
    return c;
  },
  getCardsByCustomer: (customerId: string, tenantId?: string) => {
    const cards = _cards.filter((c) => c.customerId === customerId);
    return tenantId ? cards.filter((c) => c.tenantId === tenantId) : cards;
  },
  createCard: (
    data: Omit<Card, 'id' | 'createdAt' | 'status' | 'currentBalance' | 'maskedPan'> & { productType?: string }
  ): Card => {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const normalizedProductType = data.productType?.toUpperCase();
    const card: Card = {
      ...data,
      id: genId('card'),
      maskedPan: `****-****-****-${last4}`,
      status: normalizedProductType === 'VIRTUAL' ? 'ACTIVE' : 'PENDING_ACTIVATION',
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };
    _cards = [..._cards, card];
    return card;
  },
  freezeCard: (id: string, reasonCode?: string): Card | null => {
    const card = store.getCard(id);
    if (!card) return null;
    if (card.status === 'FROZEN') return card;
    // Simulate retry logic
    let success = false;
    let attempt = 0;
    while (attempt < 3 && !success) {
      attempt++;
      if (Math.random() < 0.15) continue;
      success = true;
    }
    if (!success) return null;
    card.status = 'FROZEN';
    store.updateCard(id, { status: 'FROZEN' });
    store.addCMSAction({
      entityType: 'CARD',
      entityId: id,
      payload: { action: 'FREEZE', reasonCode, attempt },
    });
    return card;
  },
  unfreezeCard: (id: string, reasonCode?: string): Card | null => {
    const card = store.getCard(id);
    if (!card) return null;
    if (card.status !== 'FROZEN') return card;
    let success = false;
    let attempt = 0;
    while (attempt < 3 && !success) {
      attempt++;
      if (Math.random() < 0.15) continue;
      success = true;
    }
    if (!success) return null;
    card.status = 'ACTIVE';
    store.updateCard(id, { status: 'ACTIVE' });
    store.addCMSAction({
      entityType: 'CARD',
      entityId: id,
      payload: { action: 'UNFREEZE', reasonCode, attempt },
    });
    return card;
  },
  terminateCard: (id: string, reasonCode?: string): Card | null => {
    const card = store.getCard(id);
    if (!card) return null;
    if (card.status === 'BLOCKED') return card;
    let success = false;
    let attempt = 0;
    while (attempt < 3 && !success) {
      attempt++;
      if (Math.random() < 0.15) continue;
      success = true;
    }
    if (!success) return null;
    card.status = 'BLOCKED';
    store.updateCard(id, { status: 'BLOCKED' });
    store.addCMSAction({
      entityType: 'CARD',
      entityId: id,
      payload: { action: 'TERMINATE', reasonCode, attempt },
    });
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
  getBatches: (tenantId?: string) => tenantId ? _batches.filter((b) => b.tenantId === tenantId) : [..._batches],
  addBatch: (fileName: string, tenantId: string): CustomerBatch => {
    const batch: CustomerBatch = { id: genId('batch'), tenantId, fileName, status: 'UPLOADED', createdAt: new Date().toISOString() };
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

  // Platform Banks (Super Admin View)
  getPlatformBanks: () => [..._platformBanks],
  getPlatformBank: (id: string) => _platformBanks.find((b) => b.id === id) || null,

  // Platform Affiliates (Super Admin View)
  getPlatformAffiliates: (bankId?: string) => 
    bankId 
      ? _platformAffiliates.filter((a) => a.bankId === bankId) 
      : [..._platformAffiliates],
  getPlatformAffiliate: (id: string) => _platformAffiliates.find((a) => a.id === id) || null,

  // Affiliate Customers (Super Admin View)
  getAffiliateCustomers: (affiliateId: string) => _affiliateCustomers[affiliateId] || [],

  // Lookups
  getRoles: () => ROLES,
  getCardProducts: () => CARD_PRODUCTS,
  getIssuingBanks: () => ISSUING_BANKS,

  // Issuing Bank Sessions (Service Provider)
  createIssuingBankSession: (tenantId: string, bankDetails: IssuingBankDetails): IssuingBankSession => {
    const session: IssuingBankSession = {
      sessionId: genId('ibsession'),
      tenantId,
      status: 'DRAFT',
      bankDetails,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    _issuingBankSessions = [..._issuingBankSessions, session];
    return session;
  },

  getIssuingBankSession: (sessionId: string) =>
    _issuingBankSessions.find((s) => s.sessionId === sessionId) || null,

  updateIssuingBankSession: (sessionId: string, patch: Partial<IssuingBankSession>): IssuingBankSession | null => {
    const idx = _issuingBankSessions.findIndex((s) => s.sessionId === sessionId);
    if (idx === -1) return null;
    _issuingBankSessions[idx] = {
      ..._issuingBankSessions[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    _issuingBankSessions = [..._issuingBankSessions];
    return _issuingBankSessions[idx];
  },

  submitIssuingBankSession: (sessionId: string): IssuingBankSession | null => {
    const session = store.getIssuingBankSession(sessionId);
    if (!session) return null;
    return store.updateIssuingBankSession(sessionId, { status: 'SUBMITTED' });
  },

  provisionIssuingBankSession: (sessionId: string): IssuingBankSession | null => {
    const session = store.getIssuingBankSession(sessionId);
    if (!session) return null;
    return store.updateIssuingBankSession(sessionId, { status: 'PROVISIONING', provisioningProgress: 0 });
  },

  // Simulate provisioning progress (called periodically)
  updateProvisioningProgress: (sessionId: string, progress: number): IssuingBankSession | null => {
    return store.updateIssuingBankSession(sessionId, { provisioningProgress: progress });
  },

  // Complete provisioning - create an IssuingBank from the session
  completeProvisioning: (sessionId: string): IssuingBank | null => {
    const session = store.getIssuingBankSession(sessionId);
    if (!session) return null;

    const bank: IssuingBank = {
      ...session,
      id: genId('ibank'),
      status: 'PROVISIONED',
      provisionedAt: new Date().toISOString(),
    };
    _issuingBanks = [..._issuingBanks, bank];
    store.updateIssuingBankSession(sessionId, { status: 'PROVISIONED' });
    return bank;
  },

  // Fail provisioning
  failProvisioning: (sessionId: string, errorMessage: string): IssuingBankSession | null => {
    return store.updateIssuingBankSession(sessionId, {
      status: 'FAILED',
      errorMessage,
      provisioningProgress: undefined,
    });
  },

  // Get all issued banks for a tenant
  getAllIssuingBanks: (tenantId: string): IssuingBank[] =>
    _issuingBanks.filter((b) => b.tenantId === tenantId),

  // Get single issued bank
  getIssuingBank: (bankId: string): IssuingBank | null =>
    _issuingBanks.find((b) => b.id === bankId) || null,

  // Update issued bank details
  updateIssuingBank: (bankId: string, patch: Partial<IssuingBank>): IssuingBank | null => {
    const idx = _issuingBanks.findIndex((b) => b.id === bankId);
    if (idx === -1) return null;
    _issuingBanks[idx] = { ..._issuingBanks[idx], ...patch };
    _issuingBanks = [..._issuingBanks];
    return _issuingBanks[idx];
  },
}
