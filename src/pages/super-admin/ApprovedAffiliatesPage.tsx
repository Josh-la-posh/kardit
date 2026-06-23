import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import { toast } from "sonner";

interface ApprovedAffiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  approvedDate: string;
  issuingBank: string;
  complianceScore: number;
}

// Mock data - Replace with API call
const mockApprovedAffiliates: ApprovedAffiliate[] = [
  {
    id: '2',
    affiliateName: 'Global Trade Partners',
    email: 'contact@globalpartners.ng',
    contactPerson: 'Ahmed Hassan',
    approvedDate: '2024-02-26',
    issuingBank: 'stanbic',
    complianceScore: 92,
  },
  {
    id: '4',
    affiliateName: 'Digital Commerce Solutions',
    email: 'support@digitalcommerce.ng',
    contactPerson: 'Blessing Okonkwo',
    approvedDate: '2024-02-16',
    issuingBank: 'sterling',
    complianceScore: 88,
  },
];

export default function ApprovedAffiliatesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const banks = ['providus', 'wema', 'stanbic', 'sterling', 'firstbank'];

  const filteredAffiliates = useMemo(() => {
    return mockApprovedAffiliates.filter(affiliate => {
      const matchesSearch = 
        affiliate.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBank = filterBank === 'all' || affiliate.issuingBank === filterBank;
      const matchesDate = !filterDate || affiliate.approvedDate === filterDate;

      return matchesSearch && matchesBank && matchesDate;
    });
  }, [searchTerm, filterBank, filterDate]);

  const getBankLabel = (bank: string) => {
    const bankMap: { [key: string]: string } = {
      providus: 'Providus Bank',
      wema: 'WEMA Bank',
      stanbic: 'Stanbic IBTC',
      sterling: 'Sterling Bank',
      firstbank: 'FirstBank',
    };
    return bankMap[bank] || bank;
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
                <h1 className="page-title">Approved Affiliates</h1>
                <p className="page-sub">{filteredAffiliates.length} approved affiliate{filteredAffiliates.length !== 1 ? 's' : ''}</p>
              </div>
            </header>

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="section-head" style={{ marginTop: 0 }}>
                <div>
                  <div className="section-title">Filters</div>
                  <div className="section-sub">Showing {filteredAffiliates.length} of {mockApprovedAffiliates.length} approved affiliates</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBank('all');
                    setFilterDate('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Search">
                  <input className="bch-input" placeholder="Search by name, email, or contact..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </Field>
                <Field label="Issuing Bank">
                  <select className="bch-select" value={filterBank} onChange={(e) => setFilterBank(e.target.value)}>
                    <option value="all">All Banks</option>
                    {banks.map(bank => <option key={bank} value={bank}>{getBankLabel(bank)}</option>)}
                  </select>
                </Field>
                <Field label="Approved Date">
                  <input className="bch-input" type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="bch-card" style={{ marginTop: 14, overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Affiliate Name</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Bank</th>
                      <th>Score</th>
                      <th>Approved Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.map((affiliate) => (
                      <tr key={affiliate.id}>
                        <td>{affiliate.affiliateName}</td>
                        <td>{affiliate.contactPerson}</td>
                        <td>{affiliate.email}</td>
                        <td>{getBankLabel(affiliate.issuingBank)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[hsl(var(--success))]"
                                style={{ width: `${affiliate.complianceScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium w-10">{affiliate.complianceScore}%</span>
                          </div>
                        </td>
                        <td>{affiliate.approvedDate}</td>
                        <td>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => toast.info('View details for ' + affiliate.affiliateName)}
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredAffiliates.length === 0 && (
                <div className="empty-list">
                  <div className="empty-list-title">No approved affiliates found</div>
                  <div className="empty-list-sub">Adjust filters and try again.</div>
                </div>
              )}
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

