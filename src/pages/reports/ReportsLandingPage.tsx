import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useReportDefinitions } from '@/hooks/useReports';
import { FileText, ArrowRight } from 'lucide-react';

export default function ReportsLandingPage() {
  const navigate = useNavigate();
  const { definitions } = useReportDefinitions();

  const grouped = useMemo(() => {
    const map: Record<string, typeof definitions> = {};
    definitions.forEach(d => {
      if (!map[d.category]) map[d.category] = [];
      map[d.category].push(d);
    });
    return map;
  }, [definitions]);

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Reports" subtitle="Generate and export reports" />
          {Object.entries(grouped).map(([category, defs]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {defs.map(d => (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/reports/${d.id}`)}
                    className="kardit-card p-5 text-left hover:border-primary/50 transition-colors group"
                  >
                    <FileText className="h-6 w-6 text-primary mb-2" />
                    <h4 className="text-sm font-semibold mb-1">{d.name}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{d.description}</p>
                    <div className="flex items-center gap-2">
                      {d.allowedFormats.map(f => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">{f}</span>
                      ))}
                      <span className="ml-auto text-xs text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
