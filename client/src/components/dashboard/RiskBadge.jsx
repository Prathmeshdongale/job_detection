const STYLES = {
  'High Risk': 'bg-red-100 text-red-700 border-red-300',
  'Medium Risk': 'bg-amber-100 text-amber-700 border-amber-300',
  'Low Risk': 'bg-green-100 text-green-700 border-green-300',
};

export default function RiskBadge({ riskLabel }) {
  const cls = STYLES[riskLabel] ?? 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-block border rounded-full px-3 py-1 text-sm font-semibold ${cls}`}>
      {riskLabel}
    </span>
  );
}
