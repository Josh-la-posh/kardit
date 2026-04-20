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
import type { CardQueryStatus, CardQueryType } from '@/types/cardContracts';

const pageSizeOptions = ['10', '25', '50', '100'];

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const resetToFirstPage = () => setCurrentPage(1);

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
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

          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="p-6 text-sm text-muted-foreground">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No cards match the current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Masked PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Card ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issued</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((card, index) => (
                      <tr
                        key={card.id}
                        onClick={() => navigate(`/cards/${card.id}`)}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${index % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono">{card.maskedPan}</td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{card.id}</td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{card.customerId || '-'}</td>
                        <td className="px-4 py-3 text-sm">{card.productName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.issuingBankName}</td>
                        <td className="px-4 py-3"><StatusChip status={card.status as StatusType} label={card.status} /></td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{format(new Date(card.createdAt), 'MMM d, yyyy HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} - {total} total card{total === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isLoading || currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
