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

  return (
    <section className={cn('overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-[0_18px_50px_-32px_rgba(0,0,0,0.42)]', className)}>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{error}</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border/80 bg-background/40">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className={cn('px-4 md:px-6 py-4 text-left text-[9px] sm:text-xs lg:text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground')}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowKey(row, rowIndex)}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  className={cn('transition-colors hover:bg-background/40', onRowClick && 'cursor-pointer')}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn('px-4 md:px-6 py-5 align-middle', column.className)}>
                      {column.render ? column.render(row, rowIndex) : String(row[column.key as keyof T] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/80 px-6 py-4">
        <p className="text-[9px] md:text-sm xl:text-base text-muted-foreground">
          Page <span className="font-semibold text-foreground">{page}</span> of{' '}
          <span className="font-semibold text-foreground">{totalPages}</span>
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
    </section>
  );
}
