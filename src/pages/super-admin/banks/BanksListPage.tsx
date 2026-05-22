import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Building2, Eye, Plus, RefreshCw, Search } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { PaginatedTable } from '@/components/ui/paginated-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusChip } from '@/components/ui/status-chip'
import type { StatusType } from '@/components/ui/status-chip'
import { AppCard, AppCardHeader, AppCardSub, AppCardTitle } from '@/components/ui/app-card'
import { useSuperAdminBanks } from '@/hooks/useSuperAdminBanks'
import type { BankStatus } from '@/types/bankContracts'
import type { BankQueryItem } from '@/types/superAdminContracts'

const statusToChip: Record<string, StatusType> = {
  ACTIVE: 'SUCCESS',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'WARNING',
}

const statusOptions: Array<BankStatus | 'ALL'> = ['ALL', 'ACTIVE', 'INACTIVE']
const pageSizeOptions = ['20', '50', '100']

export default function BanksListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [statusFilter, setStatusFilter] = useState<BankStatus | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPageSize, setSelectedPageSize] = useState(20)

  const { banks, total, page, pageSize, isLoading, error, refetch } = useSuperAdminBanks({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    country,
    search,
    page: currentPage,
    pageSize: selectedPageSize,
  })

  const activeOnPage = banks.filter((bank) => bank.status === 'ACTIVE').length
  const inactiveOnPage = banks.filter((bank) => bank.status === 'INACTIVE').length

  function handleStatusChange(value: string) {
    setStatusFilter(value as BankStatus | 'ALL')
    setCurrentPage(1)
  }

  function handlePageSizeChange(value: string) {
    setSelectedPageSize(Number(value))
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleClearFilters() {
    setSearch('')
    setCountry('')
    setStatusFilter('ALL')
    setCurrentPage(1)
  }

  function openBankDetail(bank: BankQueryItem) {
    navigate(`/super-admin/banks/${bank.bankId}`, { state: { bank } })
  }

  const columns = useMemo(
    () => [
      {
        key: 'bank',
        header: 'Bank',
        render: (bank: BankQueryItem) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="action-icon" style={{ width: 34, height: 34 }}>
              <Building2 style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--cs-ink-900)' }}>{bank.bankName}</div>
              <div className="meta" style={{ fontSize: 11.5 }}>{bank.bankId}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'bankCode',
        header: 'Bank Code',
        className: 'id',
        render: (bank: BankQueryItem) => bank.bankCode || '-',
      },
      {
        key: 'supportedCurrencies',
        header: 'Currencies',
        className: 'meta',
        render: (bank: BankQueryItem) =>
          bank.supportedCurrencies?.length ? bank.supportedCurrencies.join(', ') : '-',
      },
      {
        key: 'createdAt',
        header: 'Created',
        className: 'meta',
        render: (bank: BankQueryItem) => format(new Date(bank.createdAt), 'MMM d, yyyy'),
      },
      {
        key: 'status',
        header: 'Status',
        render: (bank: BankQueryItem) => (
          <StatusChip status={statusToChip[bank.status] || 'INACTIVE'} label={bank.status} />
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'right',
        render: (bank: BankQueryItem) => (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openBankDetail(bank)
            }}
          >
            <Eye className="mr-1 h-3 w-3" /> View
          </Button>
        ),
      },
    ],
    [navigate],
  )

  return (
    <ProtectedRoute requiredStakeholderTypes={['SERVICE_PROVIDER']}>
      <AppLayout navVariant="service-provider">
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Banks</h1>
                <p className="page-sub">{`${total} bank${total === 1 ? '' : 's'} found`}</p>
              </div>
              <div className="row-end">
                <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                  <RefreshCw className={isLoading ? 'mr-1 h-4 w-4 animate-spin' : 'mr-1 h-4 w-4'} />
                  Refresh
                </Button>
                <Button size="sm" onClick={() => navigate('/issuing-banks/new')}>
                  <Plus className="h-4 w-4 mr-1" /> Add Issuing Bank
                </Button>
              </div>
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Total banks" value={String(total)} sub="All registered institutions" />
              <Kpi label="Active on page" value={String(activeOnPage)} sub="Visible current page count" />
              <Kpi label="Inactive on page" value={String(inactiveOnPage)} sub="Visible current page count" />
              <Kpi label="Page size" value={String(selectedPageSize)} sub="Rows per page" />
            </section>

            <AppCard padded="md" style={{ marginTop: 16 }}>
              <AppCardHeader style={{ marginBottom: 12 }}>
                <div>
                  <AppCardTitle>Filters</AppCardTitle>
                  <AppCardSub>Search and narrow the bank directory.</AppCardSub>
                </div>
              </AppCardHeader>

              <div className="banks-filters">
                <div className="search-wrap" style={{ width: '100%' }}>
                  <Search />
                  <input
                    className="bch-input bch-input-sm"
                    placeholder="Search by bank name"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'ALL' ? 'All statuses' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(selectedPageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger>
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

                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={!search && !country && statusFilter === 'ALL'}
                >
                  Clear
                </Button>
              </div>
            </AppCard>

            <AppCard style={{ marginTop: 14, overflow: 'hidden' }}>
              <PaginatedTable
                columns={columns}
                rows={banks}
                isLoading={isLoading}
                error={error}
                emptyMessage="No banks found"
                onRowClick={openBankDetail}
                rowKey={(bank) => bank.bankId}
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setCurrentPage}
                className="border-0 shadow-none rounded-none"
              />
            </AppCard>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  )
}
