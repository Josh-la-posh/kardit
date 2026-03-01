import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageHeader } from '@/components/ui/page-header';
import { Construction } from 'lucide-react';

/**
 * PlaceholderPage - Generic placeholder for routes not yet implemented
 */

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <ProtectedRoute requiredStakeholderTypes={['AFFILIATE']}>
      <AppLayout>
        <div className="animate-fade-in">
          <PageHeader 
            title={title} 
            subtitle={description}
          />

          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Construction className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium mb-2">Coming Soon</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              This feature is under development. Check back soon for updates.
            </p>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
