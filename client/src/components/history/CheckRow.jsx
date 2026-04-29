import { useDispatch } from 'react-redux';
import { deleteCheck } from '../../store/checksSlice';
import RiskBadge from '../dashboard/RiskBadge';

export default function CheckRow({ check }) {
  const dispatch = useDispatch();
  const preview = check.inputText?.slice(0, 80) + (check.inputText?.length > 80 ? '…' : '');
  const date = new Date(check.createdAt).toUTCString();

  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{preview}</td>
      <td className="px-4 py-3 text-gray-600">{check.scamProbability?.toFixed(2)}</td>
      <td className="px-4 py-3">
        <RiskBadge riskLabel={check.riskLabel} />
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{date}</td>
      <td className="px-4 py-3 text-right">
        <button
          aria-label={`Delete check ${check._id}`}
          onClick={() => dispatch(deleteCheck(check._id))}
          className="text-red-500 hover:text-red-700 text-xs font-medium"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
