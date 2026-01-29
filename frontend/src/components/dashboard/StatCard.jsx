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
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  const bgColor = colorClasses[color] || colorClasses.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend !== null && (
            <div className={`flex items-center mt-2 text-sm ${
              trendUp ? 'text-green-600' : 'text-red-600'
            }`}>
              <span className="font-semibold">
                {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
              <span className="text-gray-500 ml-1">vs período anterior</span>
            </div>
          )}
        </div>
        <div className={`ml-4 p-3 rounded-full ${bgColor} text-white`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
