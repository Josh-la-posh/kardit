import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SearchableFilterOption {
  id: string;
  label: string;
  meta?: string;
}

interface SearchableFilterSelectProps {
  value: string;
  options: SearchableFilterOption[];
  onValueChange: (value: string) => void;
  onSearch?: (query: string) => Promise<void>;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  allLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchableFilterSelect({
  value,
  options,
  onValueChange,
  onSearch,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  allLabel,
  disabled,
  loading,
}: SearchableFilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const selected = useMemo(() => options.find((option) => option.id === value), [options, value]);
  const hasLocalMatch = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return options.some((option) =>
      [option.id, option.label, option.meta]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(normalizedQuery))
    );
  }, [options, query]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!open || normalizedQuery.length < 2 || hasLocalMatch || !onSearch) return;

    let active = true;
    const timer = window.setTimeout(async () => {
      if (active) setIsSearching(true);
      try {
        await onSearch(normalizedQuery);
      } catch {
        // The empty state remains visible when the backend has no matching option.
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [hasLocalMatch, onSearch, open, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between px-3 font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {selected ? selected.label : value || placeholder}
          </span>
          {loading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            <CommandEmpty>
              {isSearching ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </span>
              ) : emptyMessage}
            </CommandEmpty>
            <CommandGroup>
              {allLabel && (
                <CommandItem
                  value={allLabel}
                  className={cn(
                    "group data-[selected=true]:bg-green-500 data-[selected=true]:text-white",
                    !value && "bg-green-700 text-white data-[selected=true]:bg-green-700"
                  )}
                  onSelect={() => {
                    onValueChange('');
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                  {allLabel}
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={[option.label, option.meta, option.id].filter(Boolean).join(' ')}
                  className={cn(
                    "group data-[selected=true]:bg-green-500 data-[selected=true]:text-white",
                    value === option.id && "bg-green-700 text-white data-[selected=true]:bg-green-700"
                  )}
                  onSelect={() => {
                    onValueChange(option.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.id ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0">
                    <span className="block truncate">{option.label}</span>
                    {option.meta && (
                      <span
                        className={cn(
                          "block truncate text-xs text-muted-foreground group-data-[selected=true]:text-green-50",
                          value === option.id && "text-green-50"
                        )}
                      >
                        {option.meta}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
