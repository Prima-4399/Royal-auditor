import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Search, Download, Loader2, WifiOff } from 'lucide-react';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data?: T[];
  fetchData?: (page: number, search?: string) => Promise<{ total: number; page: number; limit: number; data: T[] }>;
  rowsPerPage?: number;
  searchable?: boolean;
  searchKeys?: (keyof T)[];
  onRowClick?: (row: T) => void;
  onDownload?: (search: string) => void;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: 'search' | 'audit' | 'compliance' | 'leakage' | 'data' | 'results' | 'violations';
}

export function DataTable<T extends object>({
  columns,
  data: staticData,
  fetchData,
  rowsPerPage = 50,
  searchable = false,
  searchKeys = [],
  onRowClick,
  onDownload,
  title,
  subtitle,
  headerActions,
  emptyTitle = 'No Data Available',
  emptyDescription = 'Start by running an audit to populate this section with data.',
  emptyIcon = 'data',
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // Server-side state
  const [serverData, setServerData] = useState<T[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isServerSide = !!fetchData;

  // Search Debounce Implementation
  useEffect(() => {
    if (!isServerSide) {
      setDebouncedSearch(searchTerm);
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, isServerSide]);

  // Fetch server data
  const loadData = useCallback(async (page: number, search: string) => {
    if (!fetchData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData(page, search);
      setServerData(result.data as T[]);
      setServerTotal(result.total);
    } catch (err) {
      setError('Backend offline — start uvicorn on port 8000');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    if (isServerSide) {
      loadData(currentPage, debouncedSearch);
    }
  }, [isServerSide, currentPage, debouncedSearch, loadData]);

  // Client-side filtering for static data
  const activeData = isServerSide ? serverData : (staticData || []);
  const filteredData = !isServerSide && searchable && debouncedSearch
    ? activeData.filter((row) =>
        searchKeys.some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(debouncedSearch.toLowerCase());
        })
      )
    : activeData;

  const totalRecords = isServerSide ? serverTotal : filteredData.length;
  const totalPages = Math.ceil(totalRecords / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = isServerSide ? filteredData : filteredData.slice(startIndex, startIndex + rowsPerPage);
  const showingStart = totalRecords > 0 ? startIndex + 1 : 0;
  const showingEnd = Math.min(startIndex + rowsPerPage, totalRecords);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleDownloadRequest = () => {
    // If a custom onDownload handler is provided (e.g. for server-side full export), use it
    if (onDownload) {
      onDownload(debouncedSearch);
      return;
    }

    // Otherwise, fallback to client-side CSV generation of the current filtered set
    const rows = filteredData;
    if (!rows.length) return;
    const headers = columns.map(c => c.header);
    const keys = columns.map(c => c.key as string);
    const csvRows = [headers.join(',')];
    rows.forEach((row: T) => {
      const vals = keys.map(k => {
        const v = (row as Record<string, unknown>)[k];
        const s = String(v ?? '');
        return s.includes(',') ? `"${s}"` : s;
      });
      csvRows.push(vals.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title?.replace(/\s+/g, '_').toLowerCase() || 'table'}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-12">
        <WifiOff className="w-12 h-12 text-rose-400/60" />
        <p className="text-rose-400 text-[14px] font-medium">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => loadData(currentPage, debouncedSearch)}
          className="px-4 py-2 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-[12px] text-rg-text-secondary hover:border-rg-border-highlight transition-all"
        >
          Retry
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      {(title || searchable) && (
        <div className="flex items-center justify-between mb-4">
          {title && (
            <div>
              <h3 className="text-lg font-semibold text-rg-text-primary">{title}</h3>
              {subtitle && <p className="text-sm text-rg-text-muted mt-0.5">{subtitle}</p>}
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {/* Search */}
            {searchable && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-gold rounded-rg-lg opacity-0 group-focus-within:opacity-20 blur transition-opacity" />
                <div className="relative flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rg-text-muted" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="w-64 bg-rg-bg-tertiary border border-rg-border-default rounded-rg-md pl-10 pr-4 py-2 text-sm text-rg-text-primary placeholder:text-rg-text-muted focus:outline-none focus:border-rg-gold/50 transition-all"
                  />
                </div>
              </div>
            )}
            
            {headerActions}

            {/* Download CSV */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadRequest}
              className="p-2 text-rg-text-muted hover:text-rg-gold hover:bg-rg-gold/10 rounded-rg-md transition-all"
              title="Download full dataset as CSV"
            >
              <Download className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
      
      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-rg-gold animate-spin" />
            <span className="text-[12px] text-rg-text-muted uppercase tracking-wider">Loading data...</span>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && paginatedData.length === 0 && (
        <div className="py-16">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      )}

      {/* Table */}
      {!loading && paginatedData.length > 0 && (
        <div className="overflow-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="sticky top-0 z-10">
              <tr className="bg-rg-bg-tertiary/80 backdrop-blur-sm">
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`text-left px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-rg-text-muted font-bold border-b border-rg-border-default whitespace-nowrap ${
                      index === columns.length - 1 ? 'pr-12' : ''
                    }`}
                    style={{ minWidth: column.width }}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-rg-border-subtle">
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    onClick={() => onRowClick?.(row)}
                    onMouseEnter={() => setHoveredRow(rowIndex)}
                    onMouseLeave={() => setHoveredRow(null)}
                    className={`transition-all duration-200 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    style={hoveredRow === rowIndex ? {
                      backgroundImage: 'linear-gradient(to right, rgba(245,158,11,0.05), transparent)',
                      boxShadow: 'inset 2px 0 0 0 #F59E0B',
                    } : undefined}
                  >
                    {columns.map((column, colIndex) => (
                      <td
                        key={colIndex}
                        className={`px-4 py-3 text-[13px] whitespace-nowrap ${
                          colIndex === columns.length - 1 ? 'pr-12' : ''
                        }`}
                        style={{ minWidth: column.width }}
                      >
                        {column.render
                          ? column.render(row)
                          : String((row as Record<string, unknown>)[column.key as string] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
                {paginatedData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-rg-text-muted">
                      {emptyDescription || 'No data available'}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {totalPages >= 1 && !loading && paginatedData.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-rg-border-default bg-rg-bg-tertiary/30">
          <div className="text-[12px] text-rg-text-muted">
            Showing <span className="text-rg-text-secondary font-medium">{showingStart}</span>
            {' '}to{' '}
            <span className="text-rg-text-secondary font-medium">
              {showingEnd}
            </span>
            {' '}of{' '}
            <span className="text-rg-text-secondary font-medium">{totalRecords}</span>
            {' '}records
          </div>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="p-2 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-rg-text-muted hover:border-rg-border-highlight hover:text-rg-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                const isActive = pageNum === currentPage;
                return (
                  <motion.button
                    key={pageNum}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-rg-md text-[12px] font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-gold text-rg-bg-deep shadow-rg-gold'
                        : 'bg-rg-bg-card border border-rg-border-default text-rg-text-secondary hover:border-rg-border-highlight hover:text-rg-text-primary'
                    }`}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 bg-rg-bg-card border border-rg-border-default rounded-rg-md text-rg-text-muted hover:border-rg-border-highlight hover:text-rg-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
