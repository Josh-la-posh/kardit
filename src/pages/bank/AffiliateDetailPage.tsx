import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, CreditCard, Loader2, ShieldAlert, StopCircle } from 'lucide-react';
import { useBankAffiliateCards, useBankAffiliates } from '@/hooks/useBankPortal';

export default function AffiliateDetailPages() {
  const { affiliateId } = useParams<{ affiliateId: string }>();
  const navigate = useNavigate();
  const { affiliates } = useBankAffiliates();
  const { cards, total, isLoading, error, fetchCards, suspend, block } = useBankAffiliateCards(affiliateId);

  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [working, setWorking] = useState(false);
  const visibleCards = Array.isArray(cards) ? cards : [];

  const affiliate = useMemo(
    () => affiliates.find((item) => item.affiliateId === affiliateId) || null,
    [affiliates, affiliateId]
  );

  const applyFilters = async () => {
    await fetchCards({
      status: status === 'ALL' ? undefined : status,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  };

  const handleSuspend = async () => {
    if (!affiliateId || !actionReason.trim()) {
      toast.error('Enter a suspension reason first');
      return;
    }
    setWorking(true);
    try {
      const response = await suspend(actionReason.trim());
      toast.warning(`Affiliate suspended: ${response.currentStatus}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to suspend affiliate');
    } finally {
      setWorking(false);
    }
  };

  const handleBlock = async () => {
    if (!affiliateId || !actionReason.trim()) {
      toast.error('Enter a blocking reason first');
      return;
    }
    setWorking(true);
    try {
      const response = await block(actionReason.trim());
      toast.error(`Affiliate blocked: ${response.currentStatus}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to block affiliate');
    } finally {
      setWorking(false);
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['BANK']}>
      <AppLayout navVariant="bank">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/bank/affiliates')} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <PageHeader
              title={affiliate?.affiliateId || affiliateId || 'Affiliate'}
              subtitle={affiliate ? `Tenant ID: ${affiliate.tenantId}` : 'Affiliate card portfolio'}
              showBack={false}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-6">
              <Card className="border-0 shadow-lg p-6">
                <h3 className="mb-4 text-lg font-semibold">Affiliate Summary</h3>
                {affiliate ? (
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Affiliate ID</p>
                      <p className="font-semibold">{affiliate.affiliateId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tenant ID</p>
                      <p className="font-semibold">{affiliate.tenantId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Funding Volume</p>
                      <p className="font-semibold">{affiliate.totalFundingVolume.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Cards</p>
                      <p className="font-semibold">{affiliate.totalCards.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Cards</p>
                      <p className="font-semibold">{affiliate.activeCards.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Affiliate summary unavailable.</p>
                )}
              </Card>

              <Card className="border-0 shadow-lg p-6">
                <h3 className="mb-4 text-lg font-semibold">Card Filters</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-2 flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                    >
                      <option value="ALL">All</option>
                      <option value="ACTIVE">Active</option>
                      <option value="FROZEN">Frozen</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="fromDate">From Date</Label>
                    <Input id="fromDate" className="mt-2" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="toDate">To Date</Label>
                    <Input id="toDate" className="mt-2" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full" onClick={applyFilters}>Apply Filters</Button>
                  </div>
                </div>
              </Card>

              <Card className="border-0 shadow-lg">
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Cards</h2>
                    <p className="text-sm text-muted-foreground">{total} result(s)</p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <div className="text-sm text-muted-foreground">{error}</div>
                  ) : visibleCards.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      <p>No cards found for this affiliate.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Card ID</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Masked PAN</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Customer Ref</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Issued At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleCards.map((card) => (
                            <tr key={card.cardId} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{card.cardId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{card.maskedPan}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{card.productType}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{card.status}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{card.customerRefId}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{format(new Date(card.issuedAt), 'MMM d, yyyy HH:mm')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg p-6">
                <h3 className="mb-4 text-lg font-semibold">Affiliate Actions</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="reason">Action Reason</Label>
                    <textarea
                      id="reason"
                      className="mt-2 min-h-28 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
                      placeholder="REGULATORY_REVIEW_PENDING or SERIOUS_COMPLIANCE_VIOLATION"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      disabled={working}
                    />
                  </div>
                  <Button variant="outline" className="w-full text-orange-600" onClick={handleSuspend} disabled={working}>
                    <StopCircle className="mr-1 h-4 w-4" /> Suspend Affiliate
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleBlock} disabled={working}>
                    <ShieldAlert className="mr-1 h-4 w-4" /> Block Affiliate
                  </Button>
                </div>
              </Card>

              <Card className="border-0 shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Portfolio Snapshot</p>
                    <p className="font-semibold">{visibleCards.length} visible cards</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
