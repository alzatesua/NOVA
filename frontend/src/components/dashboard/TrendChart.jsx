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

export default function TrendChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Formatear datos
  const chartData = data.map(item => ({
    fecha: format(new Date(item.fecha), 'dd/MMM', { locale: es }),
    ventas: Number(item.total_ventas || 0),
    cantidad: Number(item.cantidad_facturas || 0),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Tendencia de Ventas
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="ventas"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
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
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
