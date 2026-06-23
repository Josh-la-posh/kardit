import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";

interface PendingAffiliate {
  id: string;
  affiliateName: string;
  email: string;
  contactPerson: string;
  submittedDate: string;
  issuingBank: string;
}

// Mock data - Replace with API call
const mockPendingAffiliates: PendingAffiliate[] = [
  {
    id: '1',
    affiliateName: 'TechFlow Solutions',
    email: 'info@techflow.ng',
    contactPerson: 'Chioma Okafor',
    submittedDate: '2024-02-28',
    issuingBank: 'providus',
  },
  {
    id: '5',
    affiliateName: 'Tech Innovations Ltd',
    email: 'info@techinnovations.ng',
    contactPerson: 'Tunde Adebayo',
    submittedDate: '2024-02-10',
    issuingBank: 'firstbank',
  },
];

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const [affiliates, setAffiliates] = useState(mockPendingAffiliates);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  const banks = ['providus', 'wema', 'stanbic', 'sterling', 'firstbank'];

  const filteredAffiliates = useMemo(() => {
    return affiliates.filter(affiliate => {
      const matchesSearch = 
        affiliate.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        affiliate.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBank = filterBank === 'all' || affiliate.issuingBank === filterBank;
      const matchesDate = !filterDate || affiliate.submittedDate === filterDate;

      return matchesSearch && matchesBank && matchesDate;
    });
  }, [searchTerm, filterBank, filterDate, affiliates]);



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
                <h1 className="page-title">Pending Approvals</h1>
                <p className="page-sub">{filteredAffiliates.length} submission{filteredAffiliates.length !== 1 ? 's' : ''} awaiting review</p>
              </div>
            </header>

            <section className="bch-card card-pad" style={{ marginTop: 14 }}>
              <div className="section-head" style={{ marginTop: 0 }}>
                <div>
                  <div className="section-title">Filters</div>
                  <div className="section-sub">Filter pending affiliate submissions.</div>
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
                <Field label="Submitted Date">
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
                      <th>Submitted Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAffiliates.length > 0 ? (
                      filteredAffiliates.map((affiliate) => (
                        <tr key={affiliate.id}>
                          <td>{affiliate.affiliateName}</td>
                          <td>{affiliate.contactPerson}</td>
                          <td>{affiliate.email}</td>
                          <td>{getBankLabel(affiliate.issuingBank)}</td>
                          <td>{affiliate.submittedDate}</td>
                          <td>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => navigate(`/super-admin/affiliates/${affiliate.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <p>{affiliates.length === 0 ? 'All submissions approved or rejected!' : 'No pending submissions found matching your filters.'}</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

