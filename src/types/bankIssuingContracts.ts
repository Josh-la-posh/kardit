export interface CreateIssuingBankRequest{
    legalName: string;
    shortName: string;
    bankCode: string;
    country: string;
    primaryContact: {
        fullName: string;
        email: string;
        phone: string;
    };
    status?: 'ACTIVE' | 'INACTIVE'| 'PENDING'| string;
}

export interface CreateIssuingBankResponse{
    bankId: string;
    legalName: string;
    status: string;
    internalAffiliate:{
        affiliateId: string;
        affiliateType: string;
        ownerBankId: string;
        status: string;
        isSystemManaged: boolean;
    };
    internalPartnership:{
        partnershipRequestId: string;
        status: string;
    };
    provisionedAt: string;
}

export interface getIssuingBanksDashboardResponse {
    bankId: string;
    metrics: {
        totalCardsIssued: number;
        activeCards: number;
        frozenCards: number;
        terminatedCards: number;
        totalFundingVolume: number;
        totalUnloadVolume: number;
        totalTransactionVolume: number;
        pendingApprovals: number;
        failedCmsRequests: number;
    };
    generatedAt: string;
}
	
export interface getBankAffiliatesResponse {
    bankId: string;
    affiliates: Array<{
        affiliateId: string;
        tenantId: string;
        totalCards: number;
        activeCards: number;
        totalFundingVolume: number;
    }>
}	

export interface getBankCardsRequest{
filters: {
    status?: string;
    affiliateId?: string;
    fromDate?: string;
    toDate?: string;
};
pagination: {
    page: number;
    pageSize: number;
};
}

export interface getBankCardsResponse {
    bankId: string;
    page: number;
    pageSize: number;
    total: number;
    cards: Array<{
        cardId: string;
        affiliateId: string;
        productType: string;
        status: string;
        maskedPan: string;
        customerRefId: string;
        issuedAt: string;
    }>;
}