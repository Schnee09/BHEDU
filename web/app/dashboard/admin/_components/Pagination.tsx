'use client';

export interface PaginationProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export function Pagination({
  page,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  const startItem = total === 0 ? 0 : (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, total);

  const getPaginationRange = () => {
    const range = [];
    const delta = 1;
    const left = page - delta;
    const right = page + delta + 1;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      } else if (i === left - 1 || i === right) {
        range.push('...');
      }
    }

    return range;
  };

  const range = getPaginationRange();

  return (
    <nav
      aria-label="Phân trang"
      className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 px-4 py-4 dark:border-stone-800 sm:flex-row sm:px-6"
    >
      <div className="text-sm text-gray-600 dark:text-stone-400" aria-live="polite">
        Hiển thị <span className="font-medium">{startItem}</span>–
        <span className="font-medium">{endItem}</span> trong tổng số{' '}
        <span className="font-medium">{total}</span> yêu cầu
      </div>

      {totalPages > 1 && (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Trang trước"
            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Trước
          </button>

          {range.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => typeof p === 'number' && onPageChange(p)}
              disabled={typeof p !== 'number'}
              aria-label={typeof p === 'number' ? `Trang ${p}` : undefined}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-10 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : typeof p === 'number'
                    ? 'cursor-pointer border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800'
                    : 'cursor-default text-gray-400'
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Trang sau"
            className="cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Sau
          </button>
        </div>
      )}

      {onPerPageChange && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="pagination-page-size" className="text-gray-600 dark:text-stone-400">
            Mỗi trang:
          </label>
          <select
            id="pagination-page-size"
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-2 py-1 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </nav>
  );
}
