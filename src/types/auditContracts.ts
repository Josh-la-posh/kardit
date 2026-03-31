export interface AuditRequest{
    requestContext: {
        actorUserId: string;
        userType: 'AFFILIATE' | 'BANK' | 'SERVICE_PROVIDER' | 'ADMIN' |string;
        tenantId: string;
    };
    filters: {
        fromDate: string;
        toDate: string;
        eventType: string;
        entityId: string;
    };
    pagination: {
        page: number;
        pageSize: number;
    };

}

// export interface AuditResponse{

// }