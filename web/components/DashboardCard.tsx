"use client";

export default function DashboardCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 border border-gray-100 hover:shadow-md transition">
      <h3 className="text-sm text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-indigo-600 mt-2">{value}</p>
      {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
