/**
 * Gráfico de tendencia de ventas — versión completa con manejo de estados
 */
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../hooks/useTheme';

// ─── Datos de ejemplo para desarrollo ──────────────────────────────────────
function generateMockData() {
  return Array.from({ length: 30 }, (_, i) => {
    const fecha = subDays(new Date(), 29 - i);
    return {
      fecha: fecha.toISOString(),
      total_ventas: Math.floor(Math.random() * 800000 + 200000),
      cantidad_facturas: Math.floor(Math.random() * 10 + 1),
    };
  });
}

// ─── Tooltip personalizado ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      style={{
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '10px',
        padding: '10px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        color: isDark ? '#f1f5f9' : '#0f172a',
        fontSize: 13,
      }}
    >
      <p style={{ marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: isDark ? '#94a3b8' : '#64748b', margin: 0 }}>
          {entry.dataKey === 'ventas'
            ? `💰 Ventas: $${Number(entry.value).toLocaleString('es-CO')}`
            : `📦 Facturas: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
export default function TrendChart({
  data = [],
  loading = false,
  showMockIfEmpty = true, // Cambiado a true por defecto
}) {
  // ✅ TODOS los hooks van aquí arriba, ANTES de cualquier return condicional
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const rawData = useMemo(() => {


    if (data && data.length > 0) {
      return data;
    }
    if (showMockIfEmpty) {
      const mockData = generateMockData();
      return mockData;
    }
    return [];
  }, [data, showMockIfEmpty]);

  const chartData = useMemo(() => {
    const processed = rawData.map((item) => {
      let fechaFormateada = item.fecha;
      try {
        const fecha = new Date(item.fecha);
        if (!isNaN(fecha.getTime())) {
          fechaFormateada = format(fecha, 'dd/MMM', { locale: es });
        }
      } catch (e) {
        console.error('Error formateando fecha:', item.fecha, e);
      }
      const ventas = Number(item.total_ventas || 0);
      const cantidad = Number(item.cantidad_facturas || 0);
      return {
        fecha: fechaFormateada,
        ventas: ventas,
        cantidad: cantidad,
      };
    });
    return processed;
  }, [rawData]);

  // Colores según tema
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const lineColor = isDark ? '#60a5fa' : '#3b82f6';
  const dotColor  = isDark ? '#93c5fd' : '#2563eb';

  // ─── A partir de aquí sí se permiten returns condicionales ───────────────

  if (loading) {
    return (
      <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:!border-slate-800 animate-pulse">
        <div
          className="h-5 w-48 rounded mb-6"
          style={{ background: isDark ? '#1e293b' : '#e2e8f0' }}
        />
        <div
          className="h-[300px] rounded"
          style={{ background: isDark ? '#1e293b' : '#e2e8f0' }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:!bg-slate-900 rounded-lg shadow p-6 border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:!text-slate-100">
          Tendencia de Ventas
        </h3>
        {showMockIfEmpty && data.length === 0 && rawData.length > 0 && (
          <span
            className="text-xs px-2 py-1 rounded-full"
            style={{
              background: isDark ? '#1e3a5f' : '#dbeafe',
              color: isDark ? '#93c5fd' : '#1d4ed8',
            }}
          >
            Datos de ejemplo
          </span>
        )}
      </div>

      {chartData.length === 0 ? (
        <div
          className="h-[300px] flex flex-col items-center justify-center gap-3"
          style={{ color: isDark ? '#475569' : '#94a3b8' }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="4"  y="32" width="8" height="12" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="16" y="22" width="8" height="22" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="28" y="14" width="8" height="30" rx="2" fill="currentColor" opacity="0.3" />
            <rect x="40" y="8"  width="8" height="36" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 500 }}>Sin datos de ventas</p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Los datos aparecerán cuando haya facturas registradas
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto" style={{ height: '340px', display: 'flex', justifyContent: 'center' }}>
          <LineChart width={800} height={320} data={chartData} margin={{ top: 10, right: 80, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 12, fill: textColor }}
              stroke={textColor}
              tickLine={false}
            />
            <YAxis
              yAxisId="ventas"
              tick={{ fontSize: 12, fill: textColor }}
              stroke={textColor}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `$${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                  ? `$${(v / 1_000).toFixed(0)}K`
                  : `$${v}`
              }
            />
            <Tooltip
              content={<CustomTooltip isDark={isDark} />}
              cursor={{
                stroke: isDark ? '#334155' : '#cbd5e1',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Line
              yAxisId="ventas"
              type="monotone"
              dataKey="ventas"
              stroke={lineColor}
              strokeWidth={2.5}
              dot={{ fill: dotColor, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: dotColor, strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </div>
      )}
    </div>
  );
}