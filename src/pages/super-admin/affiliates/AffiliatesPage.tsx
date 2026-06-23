import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { StatusChip, type StatusType } from "@/components/ui/status-chip";
import {
  ArrowLeft, Eye, Download, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { queryAffiliates } from "@/services/superAdminApi";
import type { AffiliateQueryItem } from "@/types/superAdminContracts";

const statusOptions = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'];
const pageSizeOptions = ['25', '50', '100'];

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function AffiliatesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPageSize, setSelectedPageSize] = useState(25);
  const [downloading, setDownloading] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateQueryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [responsePage, setResponsePage] = useState(1);
  const [responsePageSize, setResponsePageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAffiliates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const trimmedSearch = searchTerm.trim();
      const response = await queryAffiliates({
        filters: {
          status: filterStatus === 'all' ? null : [filterStatus],
          bankId: filterBank === 'all' ? null : filterBank,
          fromDate: filterDate || null,
          toDate: filterDate || null,
          search: trimmedSearch || null,
        },
        page: currentPage,
        pageSize: selectedPageSize,
      });

      setAffiliates(response.data);
      setTotal(response.total);
      setResponsePage(response.page);
      setResponsePageSize(response.pageSize);
    } catch (e) {
      setAffiliates([]);
      setTotal(0);
      setError(e instanceof Error ? e.message : 'Failed to load affiliates');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterBank, filterDate, filterStatus, searchTerm, selectedPageSize]);

  useEffect(() => {
    loadAffiliates();
  }, [loadAffiliates]);

  const totalPages = Math.max(1, Math.ceil(total / responsePageSize));

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Affiliates report downloaded successfully');
      // In a real app, trigger actual file download here
    } catch (err) {
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setFilterStatus(value);
    setCurrentPage(1);
  };

  const handleBankChange = (value: string) => {
    setFilterBank(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value: string) => {
    setFilterDate(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setSelectedPageSize(Number(value));
    setCurrentPage(1);
  };

  const filteredAffiliates = useMemo(() => affiliates, [affiliates]);

  const getStatusBadge = (status: string) => {
    const chipStatus: StatusType = (() => {
      switch (status.toUpperCase()) {
        case 'APPROVED':
        case 'ACTIVE':
          return 'SUCCESS';
        case 'REJECTED':
          return 'FAILED';
        case 'SUSPENDED':
        case 'PENDING':
        default:
          return 'WARNING';
      }
    })();

    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <StatusChip status={chipStatus} label="Approved" />;
      case 'ACTIVE':
        return <StatusChip status={chipStatus} label="Active" />;
      case 'REJECTED':
        return <StatusChip status={chipStatus} label="Rejected" />;
      case 'SUSPENDED':
        return <StatusChip status={chipStatus} label="Suspended" />;
      case 'PENDING':
      default:
        return <StatusChip status={chipStatus} label="Pending" />;
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
          <header className="page-head">
            <div>
              <button className="back-link" onClick={() => navigate('/super-admin/dashboard')}>
                <ArrowLeft /> Back to dashboard
              </button>
              <h1 className="page-title">All Affiliates</h1>
              <p className="page-sub">View and manage all onboarded affiliates.</p>
            </div>
            {/* <Button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download Report'}
            </Button> */}
          </header>

          <section className="bch-card card-pad" style={{ marginTop: 14 }}>
            <div className="section-head" style={{ marginTop: 0 }}>
              <div>
                <div className="section-title">Filters</div>
                <div className="section-sub">Showing {filteredAffiliates.length} of {total} affiliates</div>
              </div>
              <div className="row-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                    setFilterBank('all');
                    setFilterDate('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Filters
                </Button>
                <Button variant="outline" size="sm" onClick={loadAffiliates} disabled={isLoading} className="gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Search">
                <input
                  className="bch-input"
                  placeholder="Search by name, tenant, or registration..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </Field>

              <Field label="Status">
                <select
                  value={filterStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="bch-select"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </Field>

              {/* <div>
                <Label htmlFor="bank" className="text-sm font-semibold mb-2 block">Bank ID</Label>
                <Input
                  id="bank"
                  placeholder="All banks"
                  value={filterBank === 'all' ? '' : filterBank}
                  onChange={(e) => handleBankChange(e.target.value.trim() || 'all')}
                />
              </div> */}

              <Field label="Submitted Date">
                <input
                  className="bch-input"
                  type="date"
                  value={filterDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </Field>

              <Field label="Page Size">
                <select
                  aria-label="Page size"
                  value={String(selectedPageSize)}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  className="bch-select"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size} / page</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          <section className="bch-card" style={{ marginTop: 14, overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{error}</p>
                  </div>
                ) : (
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Affiliate Name</th>
                        <th>Trading Name</th>
                        <th>Tenant ID</th>
                        <th>Registration</th>
                        <th>Country</th>
                        <th>Status</th>
                        <th>Submitted Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAffiliates.map((affiliate) => (
                        <tr key={affiliate.affiliateId}>
                          <td>{affiliate.legalName}</td>
                          <td>{affiliate.tradingName || '-'}</td>
                          <td>{affiliate.tenantId}</td>
                          <td>{affiliate.registrationNumber}</td>
                          <td>{affiliate.country}</td>
                          <td>{getStatusBadge(affiliate.status)}</td>
                          <td>{formatDate(affiliate.createdAt)}</td>
                          <td>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(`/super-admin/affiliates/${affiliate.affiliateId}`, {
                                state: { affiliate },
                              })}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {!isLoading && !error && filteredAffiliates.length === 0 && (
                <div className="empty-list">
                  <div className="empty-list-title">No affiliates found</div>
                  <div className="empty-list-sub">Adjust filters and try again.</div>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {responsePage} of {totalPages} - {total} total affiliate{total === 1 ? '' : 's'}
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
          </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="bch-label">{label}</label>
      {children}
    </div>
  );
}

