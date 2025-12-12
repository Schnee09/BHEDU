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
  const startItem = (page - 1) * perPage + 1;
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{total}</span> results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {range.map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={typeof p !== 'number'}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              p === page
                ? 'bg-blue-600 text-white'
                : typeof p === 'number'
                  ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'text-gray-400 cursor-default'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {onPerPageChange && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Per page:</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}
    </div>
  );
}
