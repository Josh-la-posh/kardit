import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { StatusChip, StatusType } from '@/components/ui/status-chip';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCards } from '@/hooks/useCards';
import { store } from '@/stores/mockStore';
import { Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function CardsListPage() {
  const navigate = useNavigate();
  const { cards, isLoading } = useCards();
  const { user } = useAuth();

  const tenantScope = user?.role === 'Super Admin' ? undefined : user?.tenantId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');

  const customers = store.getCustomers(tenantScope);
  const customerMap = useMemo(() => {
    const m: Record<string, string> = {};
    customers.forEach((c) => { m[c.id] = `${c.firstName} ${c.lastName}`; });
    return m;
  }, [customers]);

  const products = useMemo(() => {
    const s = new Set(cards.map((c) => c.productName));
    return Array.from(s);
  }, [cards]);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const q = search.toLowerCase();
      const custName = customerMap[c.customerId] || '';
      const matchesSearch = !q || c.maskedPan.includes(q) || custName.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesProduct = productFilter === 'ALL' || c.productName === productFilter;
      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [cards, search, statusFilter, productFilter, customerMap]);

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Cards" subtitle="Manage all issued cards" />

          {/* Filter Bar */}
          <div className="kardit-card p-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  placeholder="Search by PAN or customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-muted border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="FROZEN">Frozen</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-muted border-border">
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Products</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="kardit-card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No cards match the current filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Masked PAN</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Issuing Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Currency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((card, i) => (
                      <tr
                        key={card.id}
                        onClick={() => navigate(`/cards/${card.id}`)}
                        className={`transition-colors hover:bg-muted/40 cursor-pointer ${i % 2 === 1 ? 'bg-muted/20' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm font-mono">{card.maskedPan}</td>
                        <td className="px-4 py-3 text-sm">{customerMap[card.customerId] || '—'}</td>
                        <td className="px-4 py-3 text-sm">{card.productName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{card.issuingBankName}</td>
                        <td className="px-4 py-3"><StatusChip status={card.status as StatusType} /></td>
                        <td className="px-4 py-3 text-sm">{card.currency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
