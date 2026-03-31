import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { useReportDefinitions } from '@/hooks/useReports';
import { ArrowRight, FileText } from 'lucide-react';

export default function ReportsLandingPage() {
  const navigate = useNavigate();
  const { groups, definitionsByGroup } = useReportDefinitions();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader title="Reports" subtitle="Choose a report area, then generate the specific report you need." />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigate(`/reports/${group.id}`)}
                className="kardit-card p-6 text-left hover:border-primary/50 transition-colors group"
              >
                <FileText className="h-6 w-6 text-primary mb-3" />
                <h3 className="text-base font-semibold mb-2">{group.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{definitionsByGroup[group.id]?.length || 0} reports</span>
                  <span className="text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
