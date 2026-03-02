import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";

import srsMarkdown from "@/content/srs.md?raw";

export default function SrsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <PageHeader
          title="SRS Reference"
          subtitle="Kardit Mini CMS  Software Requirement Specification"
        />

        <div className="kardit-card p-4">
          <ScrollArea className="h-[70vh] pr-4">
            <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
              {srsMarkdown}
            </pre>
          </ScrollArea>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
