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

            <section>
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
