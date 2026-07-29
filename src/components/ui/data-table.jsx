import { useState, useRef, useEffect } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  SlidersHorizontal,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';

function SortIcon({ sorted }) {
  if (sorted === 'asc') return <ArrowUp className="h-3 w-3" />;
  if (sorted === 'desc') return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-40" />;
}

export function DataTable({
  columns,
  data = [],
  isLoading = false,
  isFiltering = false,
  filteringMessage = 'Filter processing…',
  emptyMessage = 'No records found',
  getRowId = (row) => row._id || row.id,
  enableSorting = true,
  manualSorting = false,
  sorting,
  onSortingChange,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  enableColumnResizing = true,
  columnVisibility,
  onColumnVisibilityChange,
  enableColumnFilters = false,
  columnFilters,
  onColumnFiltersChange,
  bulkActions,
  maxHeight = 'calc(100vh - 260px)',
  compact = true,
  skeletonCols = 6,
  skeletonRows = 10,
  className,
  onRowClick,
}) {
  const [columnVisibilityOpen, setColumnVisibilityOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const columnMenuRef = useRef(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sorting || [],
      rowSelection: rowSelection || {},
      columnVisibility: columnVisibility || {},
      columnFilters: columnFilters || [],
    },
    onSortingChange,
    onRowSelectionChange,
    onColumnVisibilityChange,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: enableColumnFilters ? getFilteredRowModel() : undefined,
    enableSorting,
    enableRowSelection,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    manualSorting,
    getRowId,
  });

  const selectedCount = Object.keys(rowSelection || {}).filter((k) => rowSelection[k]).length;
  const filterableColumns = table.getAllColumns().filter((col) => col.getCanFilter());

  useEffect(() => {
    const handleClick = (e) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
        setColumnVisibilityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (isLoading) {
    return <TableSkeleton rows={skeletonRows} cols={skeletonCols} />;
  }

  const cellPad = compact ? 'px-3 py-3' : 'px-4 py-3.5';
  const headPad = compact ? 'px-3 py-3' : 'px-4 py-3.5';
  const textSize = compact ? 'text-[13px]' : 'text-sm';
  const totalColumnSize = table.getCenterTotalSize();
  const getColWidth = (size) =>
    totalColumnSize > 0 ? `${(size / totalColumnSize) * 100}%` : undefined;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-border bg-white shadow-card', className)}>
      {isFiltering && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-white px-5 py-4 shadow-elevated">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">{filteringMessage}</p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative" ref={columnMenuRef}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => setColumnVisibilityOpen((v) => !v)}
            >
              <Columns3 className="h-3.5 w-3.5" />
              Columns
            </Button>
            {columnVisibilityOpen && (
              <div className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-md border bg-background p-2 shadow-lg">
                {table.getAllLeafColumns().map((column) => {
                  if (column.id === 'select' || column.id === 'actions') return null;
                  return (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded"
                      />
                      <span className="truncate">
                        {typeof column.columnDef.header === 'string'
                          ? column.columnDef.header
                          : column.id}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {enableColumnFilters && filterableColumns.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              onClick={() => setFilterOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">
          {data.length} row{data.length !== 1 ? 's' : ''}
          {enableColumnResizing && ' · Drag column edges to resize'}
        </p>
      </div>

      {enableColumnFilters && filterOpen && (
        <div className="flex flex-wrap gap-2 border-b bg-muted/20 px-2 py-2">
          {filterableColumns.map((column) => (
            <div key={column.id} className="min-w-[120px] flex-1">
              <label className="mb-0.5 block text-[10px] font-medium uppercase text-muted-foreground">
                {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
              </label>
              <Input
                value={(column.getFilterValue() ?? '')}
                onChange={(e) => column.setFilterValue(e.target.value)}
                placeholder="Filter..."
                className="h-7 text-xs"
              />
            </div>
          ))}
        </div>
      )}

      {enableRowSelection && selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-primary/10 px-2 py-1.5">
          <span className="text-xs font-medium text-secondary">
            {selectedCount} selected
          </span>
          {bulkActions}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => onRowSelectionChange?.({})}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto" style={{ maxHeight }}>
        <table className={cn('w-full table-fixed border-collapse', textSize)}>
          <thead className="sticky top-0 z-20 border-b border-border bg-white shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'relative overflow-hidden whitespace-nowrap text-left text-[11px] font-semibold uppercase tracking-wider text-foreground/65',
                      headPad,
                      header.column.getCanSort() && 'cursor-pointer select-none hover:text-foreground'
                    )}
                    style={{ width: getColWidth(header.getSize()) }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1 pr-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon sorted={header.column.getIsSorted()} />
                      )}
                    </div>
                    {enableColumnResizing && header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-border/60 hover:bg-primary/60',
                          header.column.getIsResizing() && 'bg-primary'
                        )}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-border/70 transition-colors hover:bg-brand-soft/40',
                    row.getIsSelected() && 'bg-brand-soft/60',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original, row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={cn(cellPad, 'align-middle')}
                      style={{ width: getColWidth(cell.column.getSize()) }}
                    >
                      <div className="truncate">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DataTableSelectCell({ checked, indeterminate, onChange, ariaLabel = 'Select row' }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-3.5 w-3.5 rounded border-muted-foreground/40"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    />
  );
}
