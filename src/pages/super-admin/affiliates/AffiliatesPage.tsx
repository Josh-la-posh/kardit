import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft, Eye, Download, Loader2, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { queryAffiliates } from "@/services/superAdminApi";
import type { AffiliateQueryItem } from "@/types/superAdminContracts";

const statusOptions = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'SUSPENDED'];
const pageSizeOptions = ['10', '25', '50', '100'];

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
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-orange-100 text-orange-800">Suspended</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/super-admin/dashboard')}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <PageHeader
                title="All Affiliates"
                subtitle="View and manage all onboarded affiliates"
                showBack={false}
              />
            </div>
            {/* <Button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download Report'}
            </Button> */}
          </div>

          {/* Filters Section */}
          <Card className="border-0 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-sm font-semibold mb-2 block">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by name, tenant, or registration..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-semibold mb-2 block">Status</Label>
                <select
                  id="status"
                  value={filterStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div>
                <Label htmlFor="bank" className="text-sm font-semibold mb-2 block">Bank ID</Label>
                <Input
                  id="bank"
                  placeholder="All banks"
                  value={filterBank === 'all' ? '' : filterBank}
                  onChange={(e) => handleBankChange(e.target.value.trim() || 'all')}
                />
              </div> */}

              <div>
                <Label htmlFor="date" className="text-sm font-semibold mb-2 block">Submitted Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="outline"
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
              <Button variant="outline" onClick={loadAffiliates} disabled={isLoading} className="gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
              <select
                aria-label="Page size"
                value={String(selectedPageSize)}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {pageSizeOptions.map(size => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
              <span className="text-sm text-gray-600 self-center ml-auto">
                Showing {filteredAffiliates.length} of {total} affiliates
              </span>
            </div>
          </Card>

          {/* Affiliates Table */}
          <Card className="border-0 shadow-lg">
            <div className="p-6">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>{error}</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Affiliate Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trading Name</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tenant ID</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registration</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Country</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted Date</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAffiliates.map((affiliate) => (
                        <tr key={affiliate.affiliateId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{affiliate.legalName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.tradingName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.tenantId}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.registrationNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{affiliate.country}</td>
                          <td className="px-4 py-3 text-sm">{getStatusBadge(affiliate.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(affiliate.createdAt)}</td>
                          <td className="px-4 py-3 text-sm">
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
                <div className="text-center py-8 text-gray-500">
                  <p>No affiliates found matching your filters.</p>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-600">
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
            </div>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
