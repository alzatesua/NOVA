/**
 * Gráfico de tendencia de ventas
 */
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../hooks/useTheme';

export default function TrendChart({ data = [], loading = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 animate-pulse transition-colors duration-200">
        <div className="h-64 bg-slate-200 dark:!bg-slate-800 rounded"></div>
      </div>
    );
  }

  // Formatear datos
  const chartData = data.map(item => ({
    fecha: format(new Date(item.fecha), 'dd/MMM', { locale: es }),
    ventas: Number(item.total_ventas || 0),
    cantidad: Number(item.cantidad_facturas || 0),
  }));

  // Colores según tema
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
  const lineColor = isDark ? '#60a5fa' : '#3b82f6';

  return (
    <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
      <h3 className="text-lg font-semibold text-slate-900 dark:!text-slate-100 mb-4">
        Tendencia de Ventas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 12, fill: textColor }}
            stroke={textColor}
          />
          <YAxis
            yAxisId="ventas"
            tick={{ fontSize: 12, fill: textColor }}
            stroke={textColor}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${tooltipBorder}`,
              borderRadius: '8px',
              color: isDark ? '#f1f5f9' : '#0f172a',
            }}
            formatter={(value, name) => {
              if (name === 'ventas') {
                return [`$${value.toLocaleString()}`, 'Ventas'];
              }
              return [value, name];
            }}
          />
          <Line
            yAxisId="ventas"
            type="monotone"
            dataKey="ventas"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ fill: lineColor, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
