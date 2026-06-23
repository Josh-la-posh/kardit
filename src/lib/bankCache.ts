import type { BankQueryItem } from '@/types/bankContracts';
import type { AffiliateBankPartnership } from '@/types/affiliateBankContracts';

export const ALL_BANKS_CACHE_KEY = 'kardit.banks.all.v1';
export const LEGACY_ALL_BANKS_CACHE_KEY = 'kardit.affiliate.bank-catalog.v1';
export const APPROVED_BANKS_CACHE_KEY_PREFIX = 'kardit.affiliate.approved-banks.v1';

export type CachedBank = {
  bankId: string;
  bankName: string;
  bankCode: string;
  status: string;
};

export function approvedBanksCacheKey(affiliateId: string) {
  return `${APPROVED_BANKS_CACHE_KEY_PREFIX}:${affiliateId}`;
}

export function normalizeCachedBank(candidate: unknown): CachedBank | null {
  const bank = (candidate && typeof candidate === 'object' ? candidate : {}) as Record<string, any>;
  const bankId = String(bank.bankId || '').trim();
  const bankName = String(bank.bankName || bank.bankDetails?.name || '').trim();
  const bankCode = String(bank.bankCode || bank.bankDetails?.code || '').trim();
  const status = String(bank.status || bank.partnershipStatus || 'ACTIVE').trim();

  if (!bankId) return null;
  if (!bankName && !bankCode) return null;

  return { bankId, bankName, bankCode, status };
}

export function readCachedBanks(key: string): CachedBank[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown[];
    const normalized = Array.isArray(parsed)
      ? parsed.map(normalizeCachedBank).filter((bank): bank is CachedBank => Boolean(bank))
      : [];

    if (!normalized.length) {
      window.localStorage.removeItem(key);
      return [];
    }

    window.localStorage.setItem(key, JSON.stringify(normalized));
    return normalized;
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

export function writeCachedBanks(key: string, banks: CachedBank[]) {
  window.localStorage.setItem(key, JSON.stringify(banks));
}

export function normalizeBankQueryItem(candidate: unknown): BankQueryItem | null {
  const bank = normalizeCachedBank(candidate);
  if (!bank) return null;

  const source = (candidate && typeof candidate === 'object' ? candidate : {}) as Record<string, any>;
  return {
    bankId: bank.bankId,
    bankName: bank.bankName,
    bankCode: bank.bankCode,
    status: bank.status,
    createdAt: String(source.createdAt || new Date(0).toISOString()),
    supportedCurrencies: Array.isArray(source.supportedCurrencies) ? source.supportedCurrencies : undefined,
  };
}

export function normalizeApprovedBank(candidate: unknown): CachedBank | null {
  const bank = normalizeCachedBank(candidate);
  if (!bank) return null;

  return bank.status === 'ACTIVE' ? bank : null;
}

export function cacheAllBanks(banks: BankQueryItem[]) {
  const normalized = banks
    .map(normalizeCachedBank)
    .filter((bank): bank is CachedBank => Boolean(bank));
  writeCachedBanks(ALL_BANKS_CACHE_KEY, normalized);
  writeCachedBanks(LEGACY_ALL_BANKS_CACHE_KEY, normalized);
  return normalized;
}

export function cacheApprovedBanks(affiliateId: string, banks: AffiliateBankPartnership[]) {
  const normalized = banks
    .map(normalizeApprovedBank)
    .filter((bank): bank is CachedBank => Boolean(bank));
  writeCachedBanks(approvedBanksCacheKey(affiliateId), normalized);
  writeCachedBanks(`${LEGACY_ALL_BANKS_CACHE_KEY}:${affiliateId}`, normalized);
  return normalized;
}
