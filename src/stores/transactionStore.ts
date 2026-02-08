/**
 * Transaction, Load, and Batch Load mock store
 */

// ─── Transaction Types ──────────────────────────────────────

export type TransactionType = 'LOAD' | 'PURCHASE' | 'REFUND' | 'FEE' | 'REVERSAL' | 'OTHER';
export type TransactionStatus = 'PENDING' | 'POSTED' | 'DECLINED';

export interface Transaction {
  id: string;
  cardId: string;
  postedAt: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  narrative?: string;
}

// ─── Load Types ─────────────────────────────────────────────

export type LoadType = 'LOAD' | 'REVERSAL';
export type LoadStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface LoadTransaction {
  id: string;
  cardId: string;
  type: LoadType;
  amount: number;
  currency: string;
  reference?: string;
  status: LoadStatus;
  createdAt: string;
  relatedLoadId?: string;
}

// ─── Batch Load Types ───────────────────────────────────────

export type LoadBatchStatus = 'UPLOADED' | 'VALIDATING' | 'VALIDATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type LoadBatchRowStatus = 'VALID' | 'INVALID' | 'PROCESSED' | 'FAILED';

export interface LoadBatchRow {
  rowNumber: number;
  cardIdentifier: string;
  amount: number;
  status: LoadBatchRowStatus;
  errors?: string[];
  loadTransactionId?: string;
}

export interface LoadBatch {
  id: string;
  fileName: string;
  status: LoadBatchStatus;
  createdAt: string;
  rows: LoadBatchRow[];
}

// ─── Seed Data ──────────────────────────────────────────────

let _nextId = 500;
const genId = (prefix: string) => `${prefix}${_nextId++}`;

let _transactions: Transaction[] = [
  { id: 'tx1', cardId: 'card1', postedAt: '2026-02-07T14:30:00Z', type: 'LOAD', amount: 1000, currency: 'USD', status: 'POSTED', narrative: 'Initial load' },
  { id: 'tx2', cardId: 'card1', postedAt: '2026-02-07T10:15:00Z', type: 'PURCHASE', amount: -45.99, currency: 'USD', status: 'POSTED', narrative: 'Amazon.com' },
  { id: 'tx3', cardId: 'card1', postedAt: '2026-02-06T18:00:00Z', type: 'PURCHASE', amount: -120.00, currency: 'USD', status: 'POSTED', narrative: 'Best Buy Electronics' },
  { id: 'tx4', cardId: 'card1', postedAt: '2026-02-06T09:00:00Z', type: 'FEE', amount: -2.50, currency: 'USD', status: 'POSTED', narrative: 'Monthly maintenance fee' },
  { id: 'tx5', cardId: 'card1', postedAt: '2026-02-05T16:30:00Z', type: 'REFUND', amount: 29.99, currency: 'USD', status: 'POSTED', narrative: 'Refund – Order #12345' },
  { id: 'tx6', cardId: 'card1', postedAt: '2026-02-05T11:00:00Z', type: 'LOAD', amount: 500, currency: 'USD', status: 'POSTED', narrative: 'Payroll load' },
  { id: 'tx7', cardId: 'card1', postedAt: '2026-02-04T08:00:00Z', type: 'PURCHASE', amount: -85.00, currency: 'USD', status: 'DECLINED', narrative: 'Uber Eats' },
  { id: 'tx8', cardId: 'card2', postedAt: '2026-02-07T12:00:00Z', type: 'LOAD', amount: 200, currency: 'USD', status: 'POSTED', narrative: 'Top-up' },
  { id: 'tx9', cardId: 'card4', postedAt: '2026-02-07T09:00:00Z', type: 'PURCHASE', amount: -350.00, currency: 'USD', status: 'POSTED', narrative: 'Apple Store' },
  { id: 'tx10', cardId: 'card4', postedAt: '2026-02-06T15:00:00Z', type: 'LOAD', amount: 5000, currency: 'USD', status: 'POSTED', narrative: 'Business load' },
  { id: 'tx11', cardId: 'card5', postedAt: '2026-02-07T11:00:00Z', type: 'PURCHASE', amount: -220.00, currency: 'EUR', status: 'POSTED', narrative: 'Booking.com' },
  { id: 'tx12', cardId: 'card5', postedAt: '2026-02-05T08:00:00Z', type: 'LOAD', amount: 3000, currency: 'EUR', status: 'POSTED', narrative: 'Corporate fund' },
];

let _loadTransactions: LoadTransaction[] = [
  { id: 'lt1', cardId: 'card1', type: 'LOAD', amount: 1000, currency: 'USD', reference: 'REF-001', status: 'SUCCESS', createdAt: '2026-02-07T14:30:00Z' },
  { id: 'lt2', cardId: 'card1', type: 'LOAD', amount: 500, currency: 'USD', reference: 'REF-002', status: 'SUCCESS', createdAt: '2026-02-05T11:00:00Z' },
  { id: 'lt3', cardId: 'card4', type: 'LOAD', amount: 5000, currency: 'USD', reference: 'REF-003', status: 'SUCCESS', createdAt: '2026-02-06T15:00:00Z' },
  { id: 'lt4', cardId: 'card5', type: 'LOAD', amount: 3000, currency: 'EUR', reference: 'REF-004', status: 'SUCCESS', createdAt: '2026-02-05T08:00:00Z' },
];

let _loadBatches: LoadBatch[] = [];

// ─── Accessors & Mutators ──────────────────────────────────

export const transactionStore = {
  // Transactions
  getTransactionsByCard: (cardId: string) => _transactions.filter(t => t.cardId === cardId),
  addTransaction: (data: Omit<Transaction, 'id'>): Transaction => {
    const tx: Transaction = { ...data, id: genId('tx') };
    _transactions = [tx, ..._transactions];
    return tx;
  },

  // Load Transactions
  getLoadTransactions: () => [..._loadTransactions],
  getLoadTransaction: (id: string) => _loadTransactions.find(l => l.id === id) || null,
  getLoadsByCard: (cardId: string) => _loadTransactions.filter(l => l.cardId === cardId && l.type === 'LOAD' && l.status === 'SUCCESS'),
  createLoad: (data: Omit<LoadTransaction, 'id' | 'createdAt' | 'status'>): LoadTransaction => {
    const lt: LoadTransaction = { ...data, id: genId('lt'), status: 'SUCCESS', createdAt: new Date().toISOString() };
    _loadTransactions = [lt, ..._loadTransactions];
    return lt;
  },

  // Load summary
  getLoadSummary: () => {
    const today = new Date().toISOString().slice(0, 10);
    const todayLoads = _loadTransactions.filter(l => l.createdAt.slice(0, 10) === today && l.type === 'LOAD');
    return {
      todayCount: todayLoads.length,
      todayAmount: todayLoads.reduce((s, l) => s + l.amount, 0),
    };
  },

  // Batch loads
  getLoadBatches: () => [..._loadBatches],
  getLoadBatch: (id: string) => _loadBatches.find(b => b.id === id) || null,
  addLoadBatch: (fileName: string): LoadBatch => {
    const rowCount = 5 + Math.floor(Math.random() * 10);
    const rows: LoadBatchRow[] = Array.from({ length: rowCount }, (_, i) => ({
      rowNumber: i + 1,
      cardIdentifier: `****-****-****-${String(1000 + Math.floor(Math.random() * 9000))}`,
      amount: Math.round((50 + Math.random() * 950) * 100) / 100,
      status: Math.random() > 0.2 ? 'VALID' as const : 'INVALID' as const,
      errors: Math.random() > 0.2 ? undefined : ['Card not found'],
    }));
    const batch: LoadBatch = { id: genId('lb'), fileName, status: 'UPLOADED', createdAt: new Date().toISOString(), rows };
    _loadBatches = [batch, ..._loadBatches];
    return batch;
  },
  updateLoadBatch: (id: string, patch: Partial<LoadBatch>): LoadBatch | null => {
    const idx = _loadBatches.findIndex(b => b.id === id);
    if (idx === -1) return null;
    _loadBatches[idx] = { ..._loadBatches[idx], ...patch };
    _loadBatches = [..._loadBatches];
    return _loadBatches[idx];
  },
};
