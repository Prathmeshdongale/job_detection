import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

function scoreToColor(score) {
  if (score >= 0.7) return '#ef4444'; // red
  if (score >= 0.4) return '#f59e0b'; // amber
  return '#22c55e'; // green
}

export default function ScamGauge({ scamProbability }) {
  const pct = Math.round(scamProbability * 100);
  const color = scoreToColor(scamProbability);

  return (
    <div className="flex flex-col items-center">
      <RadialBarChart
        width={160}
        height={160}
        cx={80}
        cy={80}
        innerRadius={55}
        outerRadius={75}
        startAngle={90}
        endAngle={-270}
        data={[{ value: pct, fill: color }]}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#e5e7eb' }} />
      </RadialBarChart>
      <p className="text-2xl font-bold -mt-16" style={{ color }}>
        {scamProbability.toFixed(2)}
      </p>
      <p className="text-xs text-gray-500 mt-12">Scam probability</p>
    </div>
  );
}
