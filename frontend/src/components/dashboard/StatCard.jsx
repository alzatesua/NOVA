/**
 * Tarjeta de estadística individual
 */
import React from 'react';

export default function StatCard({
  title,
  value,
  icon,
  color = 'blue',
  trend = null,
  trendUp = true,
  loading = false,
}) {
  const colorClasses = {
    blue: 'bg-blue-500 dark:bg-blue-600',
    green: 'bg-emerald-500 dark:bg-emerald-600',
    purple: 'bg-purple-500 dark:bg-purple-600',
    orange: 'bg-orange-500 dark:bg-orange-600',
    red: 'bg-red-500 dark:bg-red-600',
  };

  const hoverBgColor = colorClasses[color] || colorClasses.blue;

  const bgColor = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 animate-pulse transition-colors duration-200">
        <div className="h-4 bg-slate-200 dark:!bg-slate-800 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-slate-200 dark:!bg-slate-800 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200 border border-slate-200 dark:!border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:!text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:!text-slate-100">{value}</p>
          {trend !== null && (
            <div className={`flex items-center mt-2 text-sm ${
              trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <span className="font-semibold">
                {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-slate-500 dark:!text-slate-400 ml-1">vs período anterior</span>
            </div>
          )}
        </div>
        <div className={`ml-4 p-3 rounded-full ${bgColor} text-white shadow-md`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
