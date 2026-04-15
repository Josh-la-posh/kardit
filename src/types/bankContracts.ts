export type BankStatus = 'ACTIVE' | 'INACTIVE' | string;

export interface QueryBanksRequest {
  filters: {
    status?: BankStatus[];
    country?: string;
    search?: string;
  };
  page: number;
  pageSize: number;
}

export interface BankQueryItem {
  bankId: string;
  bankName: string;
  bankCode: string;
  status: BankStatus;
  supportedCurrencies?: string[];
  createdAt: string;
}

export interface QueryBanksResponse {
  page: number;
  pageSize: number;
  total: number;
  data: BankQueryItem[];
}
