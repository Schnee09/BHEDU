"use client";

// Playful accent colors for different cards
const cardColors = [
  { bg: 'bg-indigo-100', border: 'border-indigo-600', text: 'text-indigo-600', shadow: 'shadow-[4px_4px_0px_#4F46E5]' },
  { bg: 'bg-teal-100', border: 'border-teal-600', text: 'text-teal-600', shadow: 'shadow-[4px_4px_0px_#0D9488]' },
  { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-600', shadow: 'shadow-[4px_4px_0px_#D97706]' },
  { bg: 'bg-pink-100', border: 'border-pink-600', text: 'text-pink-600', shadow: 'shadow-[4px_4px_0px_#DB2777]' },
  { bg: 'bg-cyan-100', border: 'border-cyan-600', text: 'text-cyan-600', shadow: 'shadow-[4px_4px_0px_#0891B2]' },
  { bg: 'bg-lime-100', border: 'border-lime-600', text: 'text-lime-600', shadow: 'shadow-[4px_4px_0px_#65A30D]' },
];

export default function DashboardCard({
  title,
  value,
  subtitle,
  colorIndex = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  colorIndex?: number;
}) {
  const colors = cardColors[colorIndex % cardColors.length];
  
  return (
    <div className={`${colors.bg} border-3 border-black rounded-2xl p-6 ${colors.shadow} hover:shadow-[6px_6px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 cursor-pointer`}>
      <h3 className="text-sm text-indigo-900 font-bold uppercase tracking-wider" style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</h3>
      <p className={`text-4xl font-bold ${colors.text} mt-3`} style={{ fontFamily: 'Fredoka, sans-serif' }}>{value}</p>
      {subtitle && <p className="text-sm text-indigo-700 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
}
