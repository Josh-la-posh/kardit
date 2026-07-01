import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCards } from '@/hooks/useCards';
import { Search, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginatedTable } from '@/components/ui/paginated-table';
import type { CardQueryStatus, CardQueryType } from '@/types/cardContracts';

const pageSizeOptions = ['25', '50', '100'];

export default function CardsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CardQueryStatus | 'ALL'>('ALL');
  const [cardTypeFilter, setCardTypeFilter] = useState<CardQueryType | 'ALL'>('ALL');
  const [productId, setProductId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(25);

  const selectedStatuses = useMemo(
    () => (statusFilter === 'ALL' ? undefined : [statusFilter]),
    [statusFilter]
  );
  const selectedCardTypes = useMemo(
    () => (cardTypeFilter === 'ALL' ? undefined : [cardTypeFilter]),
    [cardTypeFilter]
  );

  const { cards, total, page, pageSize, isLoading, error, refetch } = useCards({
    status: selectedStatuses,
    cardType: selectedCardTypes,
    productId: productId.trim() || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page: currentPage,
    pageSize: selectedPageSize,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cards.filter((card) => {
      return (
        !q ||
        card.maskedPan.toLowerCase().includes(q) ||
        card.customerId.toLowerCase().includes(q) ||
        card.id.toLowerCase().includes(q)
      );
    });
  }, [cards, search]);

  const resetToFirstPage = () => setCurrentPage(1);
  const columns = useMemo(
    () => [
      {
        key: 'maskedPan',
        header: 'Masked PAN',
        className: 'font-mono',
        render: (card: (typeof cards)[number]) => card.maskedPan,
      },
      // {
      //   key: 'id',
      //   header: 'Card ID',
      //   className: 'font-mono text-muted-foreground',
      //   render: (card: (typeof cards)[number]) => card.id,
      // },
      // {
      //   key: 'customerId',
      //   header: 'Customer ID',
      //   className: 'font-mono text-muted-foreground',
      //   render: (card: (typeof cards)[number]) => card.customerId || '-',
      // },
      {
        key: 'productName',
        header: 'Product',
        render: (card: (typeof cards)[number]) => card.productName,
      },
      {
        key: 'issuingBankName',
        header: 'Bank',
        className: 'text-muted-foreground',
        render: (card: (typeof cards)[number]) => card.issuingBankName,
      },
      {
        key: 'status',
        header: 'Status',
        render: (card: (typeof cards)[number]) => (
          <StatusChip status={card.status as StatusType} label={card.status} />
        ),
      },
      {
        key: 'createdAt',
        header: 'Issued',
        className: 'text-muted-foreground',
        render: (card: (typeof cards)[number]) => format(new Date(card.createdAt), 'MMM d, yyyy HH:mm'),
      },
    ],
    []
  );

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE', 'BANK']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader
            title="Cards"
            subtitle={`${total} issued card${total === 1 ? '' : 's'}`}
            actions={
              <div className="flex gap-2">
                <Button variant="outline" onClick={refetch} disabled={isLoading}>
                  {isLoading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Refresh
                </Button>
                <Button onClick={() => navigate('/cards/create')}>
                  <Plus className="h-4 w-4 mr-1" /> Create Card
                </Button>
              </div>
            }
          />

          <div className="kardit-card p-4 mb-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_150px_160px_150px_150px_130px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder="Search by PAN, card ID, or customer ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as CardQueryStatus | 'ALL');
                  resetToFirstPage();
                }}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="FROZEN">Frozen</SelectItem>
                  <SelectItem value="TERMINATED">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={cardTypeFilter}
                onValueChange={(value) => {
                  setCardTypeFilter(value as CardQueryType | 'ALL');
                  resetToFirstPage();
                }}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Card type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="VIRTUAL">Virtual</SelectItem>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                </SelectContent>
              </Select>
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Product ID"
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  resetToFirstPage();
                }}
              />
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                type="date"
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  resetToFirstPage();
                }}
              />
              <input
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                type="date"
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  resetToFirstPage();
                }}
              />
              <Select
                value={String(selectedPageSize)}
                onValueChange={(value) => {
                  setSelectedPageSize(Number(value));
                  resetToFirstPage();
                }}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Page size" />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <PaginatedTable
            columns={columns}
            rows={filtered}
            isLoading={isLoading}
            error={error}
            emptyMessage="No cards match the current filters."
            onRowClick={(card) => navigate(`/cards/${card.id}`)}
            rowKey={(card) => card.id}
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setCurrentPage}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
