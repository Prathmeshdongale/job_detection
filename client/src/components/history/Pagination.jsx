import { useDispatch } from 'react-redux';
import { fetchHistory } from '../../store/checksSlice';

export default function Pagination({ pagination }) {
  const dispatch = useDispatch();
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit) || 1;

  const go = (newPage) => dispatch(fetchHistory({ page: newPage, limit }));

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}
