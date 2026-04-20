import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Building2, Loader2, RefreshCw, Send } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusChip } from '@/components/ui/status-chip';
import type { StatusType } from '@/components/ui/status-chip';
import { useAffiliateBankPartnerships } from '@/hooks/useAffiliateBanks';
import { useBankQuery } from '@/hooks/useBanks';

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  PENDING_BANK_APPROVAL: 'PENDING',
  REJECTED: 'FAILED',
  INACTIVE: 'INACTIVE',
};

export default function AffiliateBanksPage() {
  const { affiliateId, banks, isLoading, isSubmitting, error, refresh, requestPartnership } = useAffiliateBankPartnerships();
  const [selectedBankId, setSelectedBankId] = useState('');
  const [bankSearch, setBankSearch] = useState('');
  const [note, setNote] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const bankCatalogStatuses = useMemo(() => ['ACTIVE'], []);
  const {
    banks: bankCatalog,
    isLoading: bankCatalogLoading,
    error: bankCatalogError,
  } = useBankQuery({
    status: bankCatalogStatuses,
    search: bankSearch,
    page: 1,
    pageSize: 25,
  });

  const requestableBanks = useMemo(() => {
    const existing = new Set(banks.map((bank) => bank.bankId));
    return bankCatalog.filter((bank) => !existing.has(bank.bankId));
  }, [bankCatalog, banks]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!selectedBankId) {
      setLocalError('Select a bank to continue.');
      return;
    }
    if (!note.trim()) {
      setLocalError('Add a short partnership note before submitting.');
      return;
    }
    try {
      await requestPartnership({
        bankId: selectedBankId,
        note: note.trim(),
      });
      toast.success('Partnership request submitted');
      setSelectedBankId('');
      setNote('');
    } catch (e: any) {
      setLocalError(e?.message || 'Failed to submit partnership request');
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout navVariant="affiliate">
        <div className="animate-fade-in">
          <PageHeader
            title="Bank Partnerships"
            subtitle=''
            actions={
              <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                <RefreshCw className="mr-1 h-4 w-4" /> Refresh
              </Button>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="kardit-card overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-base font-semibold">Partnered Banks</h2>
                <p className="text-sm text-muted-foreground">Track all current and requested bank partnerships.</p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : error && !banks.length ? (
                <div className="px-6 py-10 text-sm text-muted-foreground">{error}</div>
              ) : banks.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No bank partnerships yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Updated</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {banks.map((bank) => (
                        <tr key={bank.bankId} className="hover:bg-muted/30">
                          <td className="px-4 py-4 text-sm">
                            <p className="font-medium">{bank.bankName}</p>
                            <p className="text-xs text-muted-foreground">{bank.bankId}</p>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <StatusChip
                              status={statusToChip[bank.partnershipStatus] || 'INACTIVE'}
                              label={bank.partnershipStatus}
                            />
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {format(new Date(bank.lastUpdatedAt), 'MMM d, yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-4 text-sm text-muted-foreground">
                            {bank.rejectionReason || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="kardit-card p-6">
              <div className="mb-5">
                <h2 className="text-base font-semibold">Request New Partnership</h2>
                <p className="text-sm text-muted-foreground">
                  Submit a request to add another issuing bank to your affiliate portfolio.
                </p>
              </div>

              {(localError || error) && (
                <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {localError || error}
                </div>
              )}
              {bankCatalogError && (
                <div className="mb-4 rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                  {bankCatalogError}
                </div>
              )}

              <form className="space-y-4" onSubmit={onSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Search Banks</label>
                  <input
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Search by bank name or code..."
                    value={bankSearch}
                    onChange={(e) => {
                      setBankSearch(e.target.value);
                      setSelectedBankId('');
                    }}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Bank</label>
                  <Select value={selectedBankId} onValueChange={setSelectedBankId} disabled={isSubmitting || bankCatalogLoading}>
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue placeholder={bankCatalogLoading ? 'Loading banks...' : requestableBanks.length ? 'Select a bank' : 'No banks available'} />
                    </SelectTrigger>
                    <SelectContent>
                      {requestableBanks.map((bank) => (
                        <SelectItem key={bank.bankId} value={bank.bankId}>
                          {bank.bankName} ({bank.bankCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Request Note</label>
                  <textarea
                    className="min-h-32 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="We would like to distribute NGN prepaid cards for our retail network."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || bankCatalogLoading || !requestableBanks.length}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-1 h-4 w-4" /> Request Partnership
                    </>
                  )}
                </Button>
              </form>
            </section>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
