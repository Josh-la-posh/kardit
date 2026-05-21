import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useReportDefinitions } from '@/hooks/useReports';
import { ArrowRight, FileText } from 'lucide-react';

export default function ReportsLandingPage() {
  const navigate = useNavigate();
  const { groups, definitionsByGroup } = useReportDefinitions();
  const totalReports = groups.reduce((n, group) => n + (definitionsByGroup[group.id]?.length || 0), 0);

  return (
    <ProtectedRoute>
      <AppLayout>
        <main className="scr-main">
          <div className="container">
            <header className="page-head">
              <div>
                <h1 className="page-title">Reports</h1>
                <p className="page-sub">Choose a report area, then generate the specific report you need.</p>
              </div>
            </header>

            {/* <section className="kpis" style={{ marginTop: 14 }}>
              <Kpi label="Report groups" value={String(groups.length)} sub="Cards, operations, and customers" />
              <Kpi label="Available reports" value={String(totalReports)} sub="Definitions ready to run" />
              <Kpi label="Export formats" value="CSV, XLSX" sub="All reports support file download" />
              <Kpi label="Access scope" value="Role-based" sub="Data visibility follows user scope" />
            </section> */}

            <section>
              {/* <div className="section-head">
                <div>
                  <div className="section-title">Report areas</div>
                  <div className="section-sub">Select a domain to continue</div>
                </div>
              </div> */}

              <div className="action-grid">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate(`/reports/${group.id}`)}
                    className="action-card"
                    style={{ textAlign: 'left' }}
                    type="button"
                  >
                    <div className="action-icon">
                      <FileText />
                    </div>
                    <div className="action-title">{group.name}</div>
                    <div className="action-meta">{group.description}</div>
                    <div className="action-cta">
                      Open {definitionsByGroup[group.id]?.length || 0} reports <ArrowRight />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
