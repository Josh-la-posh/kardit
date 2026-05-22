import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface PaginatedColumn<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface PaginatedTableProps<T> {
  columns: PaginatedColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: (row: T, index: number) => string | number;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginatedTable<T extends Record<string, unknown>>({
  columns,
  rows,
  isLoading = false,
  error,
  emptyMessage = 'No data available',
  onRowClick,
  rowKey = (_row, index) => index,
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginatedTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(1, pageSize)));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const shouldShowPager = total > pageSize;

  return (
    <section className={cn('app-table overflow-hidden rounded-[var(--cs-radius-lg)] border border-[var(--cs-line)] bg-[var(--surface)] shadow-[var(--cs-shadow-sm)]', className)}>
      {isLoading ? (
        <div className="app-table__state flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="app-table__state py-16 text-center text-sm text-muted-foreground">{error}</div>
      ) : rows.length === 0 ? (
        <div className="app-table__state py-16 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="app-table__table min-w-full">
            <thead>
              <tr className="app-table__head-row border-b border-[var(--cs-line)] bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn('app-table__head-cell px-4 md:px-6 py-5 text-left text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground')}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="app-table__body divide-y divide-[var(--cs-line)]">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowKey(row, rowIndex)}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={cn(
                    'app-table__row transition-colors hover:bg-muted/50',
                    rowIndex % 2 === 1 && 'app-table__row--alt',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn('app-table__cell px-4 md:px-6 py-4 text-sm whitespace-nowrap align-middle', column.className)}>
                      {column.render ? column.render(row, rowIndex) : String(row[column.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shouldShowPager && (
        <div className="app-table__pager flex items-center justify-between border-t border-[var(--cs-line)] px-6 py-4">
          <p className="app-table__pager-meta text-sm text-[var(--cs-ink-100)]">
            Page <span className="font-semibold text-[var(--cs-ink-700)]">{page}</span> of{' '}
            <span className="font-semibold text-[var(--cs-ink-700)]">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => canGoPrev && onPageChange(page - 1)} disabled={!canGoPrev || isLoading}>
              Previous
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => canGoNext && onPageChange(page + 1)} disabled={!canGoNext || isLoading}>
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
