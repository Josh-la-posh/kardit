import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBatchesReport,
  getCardBalancesReport,
  getCardLifecycleEventsReport,
  getCardLoadsReport,
  getCardTransactionsReport,
  getCardUnloadsReport,
  getCardsFulfillmentReport,
  getCardsIssuanceReport,
  getCmsTracesReport,
  getCustomerSupportViewReport,
  getExceptionsReport,
} from '@/services/reportApi';

export interface ReportGroup {
  id: string;
  name: string;
  description: string;
}

export interface ReportDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  allowedFormats: ('CSV' | 'XLSX')[];
  groupId: string;
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
  rawResponse?: unknown;
  errorMessage?: string;
}

const REPORT_GROUPS: ReportGroup[] = [
  { id: 'cards', name: 'Cards', description: 'Card activity, issuance, fulfillment, balances, and lifecycle reporting.' },
  { id: 'operations', name: 'Operations', description: 'Batch processing, CMS traceability, and exception monitoring.' },
  { id: 'customers', name: 'Customers', description: 'Support-facing customer report views across issued cards.' },
];

const REPORT_DEFINITIONS: ReportDefinition[] = [
  { id: 'card-transactions', code: 'CARD_TRANSACTIONS', name: 'Card Transactions', description: 'Paginated transaction report for a single card', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'card-loads', code: 'CARD_LOADS', name: 'Card Loads', description: 'Funding history for a single card', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'card-unloads', code: 'CARD_UNLOADS', name: 'Card Unloads', description: 'Unload history for a single card', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'card-lifecycle-events', code: 'CARD_LIFECYCLE_EVENTS', name: 'Card Lifecycle Events', description: 'Freeze, unfreeze, terminate, and related lifecycle events', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'card-balances', code: 'CARD_BALANCES', name: 'Card Balance Snapshots', description: 'Historical balance snapshots for a single card', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'card-issuance', code: 'CARD_ISSUANCE', name: 'Card Issuance Report', description: 'Issued cards filtered by period and product type', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'card-fulfillment', code: 'CARD_FULFILLMENT', name: 'Card Fulfillment Report', description: 'Fulfillment and delivery tracking report', category: 'Cards', groupId: 'cards', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'batches', code: 'BATCHES', name: 'Batch Operations', description: 'Summary of batch operations filtered by date and operation type', category: 'Operations', groupId: 'operations', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'cms-traces', code: 'CMS_TRACES', name: 'CMS Traces', description: 'Trace external CMS requests by card and operation type', category: 'Operations', groupId: 'operations', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'exceptions', code: 'EXCEPTIONS', name: 'Exceptions Report', description: 'Operational failures and retry-worthy exceptions', category: 'Operations', groupId: 'operations', allowedFormats: ['CSV', 'XLSX'] },
  { id: 'customer-support-view', code: 'CUSTOMER_SUPPORT_VIEW', name: 'Customer Support View', description: 'Support snapshot of a customer and associated cards', category: 'Customers', groupId: 'customers', allowedFormats: ['CSV', 'XLSX'] },
];

function toTable(response: any): { columns: string[]; rows: (string | number | null)[][] } {
  const records = Array.isArray(response?.records)
    ? response.records
    : Array.isArray(response?.record)
      ? response.record
      : null;

  if (response?.transactions) {
    return {
      columns: ['Transaction ID', 'Merchant', 'Type', 'Amount', 'Currency', 'Status', 'Authorization Code', 'Transaction Date'],
      rows: response.transactions.map((item: any) => [
        item.transactionId,
        item.merchantName,
        item.transactionType,
        item.amount,
        item.currency,
        item.status,
        item.authorizationCode,
        item.transactionDate,
      ]),
    };
  }

  if (response?.loads) {
    return {
      columns: ['Funding Transaction ID', 'Amount', 'Currency', 'Funding Source', 'Transfer Reference', 'Status', 'Balance After', 'Created At'],
      rows: response.loads.map((item: any) => [
        item.fundingTransactionId,
        item.amount,
        item.currency,
        item.fundingSource,
        item.bankTransferReference,
        item.status,
        item.balanceAfter,
        item.createdAt,
      ]),
    };
  }

  if (response?.unloads) {
    return {
      columns: ['Unload Transaction ID', 'Amount', 'Currency', 'Destination Account', 'Destination Bank', 'Status', 'Balance After', 'Processed At'],
      rows: response.unloads.map((item: any) => [
        item.unloadTransactionId,
        item.amount,
        item.currency,
        item.destinationAccount,
        item.destinationBank,
        item.status,
        item.balanceAfter,
        item.processedAt,
      ]),
    };
  }

  if (response?.events) {
    return {
      columns: ['Event ID', 'Event Type', 'Actor User ID', 'Actor Role', 'Reason', 'Previous Status', 'New Status', 'Timestamp'],
      rows: response.events.map((item: any) => [
        item.eventId,
        item.eventType,
        item.actorUserId,
        item.actorRole,
        item.reason,
        item.previousStatus,
        item.newStatus,
        item.timestamp,
      ]),
    };
  }

  if (response?.snapshots) {
    return {
      columns: ['Ledger Balance', 'Available Balance', 'Currency', 'Source', 'Retrieved At'],
      rows: response.snapshots.map((item: any) => [
        item.ledgerBalance,
        item.availableBalance,
        item.currency,
        item.source,
        item.retrievedAt,
      ]),
    };
  }

  if (response?.cards) {
    return {
      columns: ['Card ID', 'Status', 'Product Type', 'Available Balance', 'Currency', 'Recent Transactions', 'Recent Loads', 'Recent Unloads', 'Fulfillment Status'],
      rows: response.cards.map((item: any) => [
        item.cardId,
        item.status,
        item.productType,
        item.availableBalance ?? null,
        item.currency ?? null,
        item.recentTransactions ?? null,
        item.recentLoads ?? null,
        item.recentUnloads ?? null,
        item.fulfillmentStatus ?? null,
      ]),
    };
  }

  if (records) {
    const first = records[0];
    if (first?.issuedAt !== undefined) {
      return {
        columns: ['Card ID', 'Customer ID', 'Product ID', 'Bank ID', 'Card Type', 'Status', 'Issued At', 'Virtual Account Status'],
        rows: records.map((item: any) => [
          item.cardId,
          item.customerId,
          item.productId,
          item.bankId,
          item.cardType,
          item.status,
          item.issuedAt,
          item.virtualAccountStatus,
        ]),
      };
    }

    if (first?.bureauStatus !== undefined && first?.trackingNumber !== undefined) {
      return {
        columns: ['Card ID', 'Bureau Status', 'Carrier', 'Tracking Number', 'Tracking URL', 'Last Updated At'],
        rows: records.map((item: any) => [
          item.cardId,
          item.bureauStatus,
          item.carrier,
          item.trackingNumber,
          item.trackingUrl,
          item.lastUpdatedAt,
        ]),
      };
    }

    if (first?.batchId !== undefined) {
      return {
        columns: ['Batch ID', 'Operation Type', 'Total Rows', 'Successful Rows', 'Failed Rows', 'Total Processed Amount', 'Created At'],
        rows: records.map((item: any) => [
          item.batchId,
          item.operationType,
          item.totalRows,
          item.successfulRows,
          item.failedRows,
          item.totalProcessedAmount,
          item.createdAt,
        ]),
      };
    }

    if (first?.requestId !== undefined) {
      return {
        columns: ['Request ID', 'Operation Type', 'Card ID', 'CMS Endpoint', 'CMS Reference', 'Request Timestamp', 'Response Code', 'Response Message'],
        rows: records.map((item: any) => [
          item.requestId,
          item.operationType,
          item.cardId,
          item.cmsEndpoint,
          item.cmsReference,
          item.requestTimestamp,
          item.responseCode,
          item.responseMessage,
        ]),
      };
    }

    if(records){
      return {
      columns: ['Operation Type', 'Entity ID', 'Card ID', 'Status', 'Error Code', 'Error Message', 'Occurred At'],
      rows: records.map((item: any) => [
        item.operationType,
        item.entityId,
        item.cardId,
        item.status,
        item.errorCode,
        item.errorMessage,
        item.occurredAt,
      ]),
    };
    }
  }

  return { columns: [], rows: [] };
}

export function useReportDefinitions() {
  const definitionsByGroup = useMemo(() => {
    const map: Record<string, ReportDefinition[]> = {};
    REPORT_DEFINITIONS.forEach((definition) => {
      if (!map[definition.groupId]) map[definition.groupId] = [];
      map[definition.groupId].push(definition);
    });
    return map;
  }, []);

  return { groups: REPORT_GROUPS, definitions: REPORT_DEFINITIONS, definitionsByGroup };
}

export function useRunReport(definitionId: string) {
  const [instance, setInstance] = useState<ReportInstance | null>(null);

  useEffect(() => {
    setInstance(null);
  }, [definitionId]);

  const generate = useCallback(async (filters: Record<string, any>) => {
    const id = `ri-${Date.now()}`;
    setInstance({
      id,
      reportDefinitionId: definitionId,
      createdAt: new Date().toISOString(),
      status: 'QUEUED',
      filters,
    });

    try {
      setInstance((prev) => (prev ? { ...prev, status: 'RUNNING' } : prev));

      let response: any;
      switch (definitionId) {
        case 'card-transactions':
          response = await getCardTransactionsReport(filters.cardId, filters);
          break;
        case 'card-loads':
          response = await getCardLoadsReport(filters.cardId, filters);
          break;
        case 'card-unloads':
          response = await getCardUnloadsReport(filters.cardId, filters);
          break;
        case 'card-lifecycle-events':
          response = await getCardLifecycleEventsReport(filters.cardId, filters);
          break;
        case 'card-balances':
          response = await getCardBalancesReport(filters.cardId, filters);
          break;
        case 'card-issuance':
          response = await getCardsIssuanceReport(filters);
          break;
        case 'card-fulfillment':
          response = await getCardsFulfillmentReport(filters);
          break;
        case 'batches':
          response = await getBatchesReport(filters);
          break;
        case 'cms-traces':
          response = await getCmsTracesReport(filters);
          break;
        case 'exceptions':
          response = await getExceptionsReport(filters);
          break;
        case 'customer-support-view':
          response = await getCustomerSupportViewReport(filters.customerRefId);
          break;
        default:
          throw new Error('Unsupported report definition');
      }

      const preview = toTable(response);
      setInstance((prev) =>
        prev
          ? {
              ...prev,
              status: 'COMPLETED',
              previewColumns: preview.columns,
              previewRows: preview.rows,
              rawResponse: response,
            }
          : prev
      );
    } catch (error) {
      setInstance((prev) =>
        prev
          ? {
              ...prev,
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Report failed',
            }
          : prev
      );
    }
  }, [definitionId]);

  return { instance, generate };
}
