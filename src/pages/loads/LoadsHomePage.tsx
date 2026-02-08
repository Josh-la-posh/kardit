import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useLoadSummary } from '@/hooks/useLoads';
import { Loader2, ArrowRight, CreditCard, RotateCcw, Layers } from 'lucide-react';

const tiles = [
  { label: 'Single Load', description: 'Load funds to a single card', icon: CreditCard, path: '/loads/single' },
  { label: 'Load Reversal', description: 'Reverse a previous load', icon: RotateCcw, path: '/loads/reversal' },
  { label: 'Batch Load', description: 'Process multiple loads from a file', icon: Layers, path: '/loads/batches' },
];

export default function LoadsHomePage() {
  const navigate = useNavigate();
  const { summary, isLoading } = useLoadSummary();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Loads" subtitle="Load funds onto cards" />

          {/* Summary widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="kardit-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Today's Loads</p>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" /> : (
                <p className="text-2xl font-bold text-primary mt-1">{summary.todayCount}</p>
              )}
            </div>
            <div className="kardit-card p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Today's Total Amount</p>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" /> : (
                <p className="text-2xl font-bold text-primary mt-1">${summary.todayAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              )}
            </div>
          </div>

          {/* Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tiles.map(tile => (
              <button
                key={tile.path}
                onClick={() => navigate(tile.path)}
                className="kardit-card p-6 text-left hover:border-primary/50 transition-colors group"
              >
                <tile.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-base font-semibold mb-1">{tile.label}</h3>
                <p className="text-sm text-muted-foreground mb-3">{tile.description}</p>
                <span className="text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Go <ArrowRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
