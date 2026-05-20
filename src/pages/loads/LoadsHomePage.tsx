import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useLoadSummary } from '@/hooks/useLoads';
import { Loader2, ArrowRight, CreditCard, RotateCcw } from 'lucide-react';

const tiles = [
  { label: 'Single Load', description: 'Load funds to a single card', icon: CreditCard, path: '/loads/single' },
  { label: 'Card Unload', description: 'Move funds from a card to a destination account', icon: RotateCcw, path: '/loads/reversal' },
  // { label: 'Batch Load', description: 'Process multiple loads from a file', icon: Layers, path: '/loads/batches' },
];

export default function LoadsHomePage() {
  const navigate = useNavigate();
  const { summary, isLoading } = useLoadSummary();

  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <main className="scr-main">
          <div className="container container--narrow">
            <header className="page-head">
              <div>
                <h1 className="page-title">Loads</h1>
                <p className="page-sub">Manage card funding and unload operations.</p>
              </div>
            </header>

            <section className="kpis" style={{ marginTop: 14 }}>
              <div className="kpi">
                <div className="kpi-label">Today's loads</div>
                <div className="kpi-value">
                  {isLoading ? <Loader2 className="spin" style={{ width: 20, height: 20 }} /> : summary.todayCount}
                </div>
                <div className="kpi-sub">Number of load operations posted today</div>
              </div>
              <div className="kpi">
                <div className="kpi-label">Today's amount</div>
                <div className="kpi-value">
                  {isLoading ? <Loader2 className="spin" style={{ width: 20, height: 20 }} /> : `$${summary.todayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="kpi-sub">Aggregate load value processed today</div>
              </div>
            </section>

            <section>
              <div className="section-head">
                <div>
                  <div className="section-title">Load operations</div>
                  <div className="section-sub">Choose what you want to process</div>
                </div>
              </div>

              <div className="action-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {tiles.map((tile) => (
                  <button
                    key={tile.path}
                    onClick={() => navigate(tile.path)}
                    className="action-card"
                    type="button"
                    style={{ textAlign: 'left' }}
                  >
                    <div className="action-icon">
                      <tile.icon />
                    </div>
                    <div className="action-title">{tile.label}</div>
                    <div className="action-meta">{tile.description}</div>
                    <div className="action-cta">
                      Open <ArrowRight />
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
