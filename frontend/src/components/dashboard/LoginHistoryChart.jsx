import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function LoginHistoryChart({ data = [], loading = false, showMockIfEmpty = true }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Generar datos de prueba si está vacío
  const getChartData = () => {
    if (data && data.length > 0) {
      return data;
    }

    if (!showMockIfEmpty) return [];

    // Datos de prueba para los últimos 7 días
    const hoy = new Date();
    const datos = Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() - (6 - i));
      return {
        fecha: fecha.toISOString().split('T')[0],
        total_logins: Math.floor(Math.random() * 20 + 5),
        logins_exitosos: Math.floor(Math.random() * 18 + 4),
        logins_fallidos: Math.floor(Math.random() * 3),
      };
    });
    return datos;
  };

  const chartData = getChartData();

  // Preparar datos para Chart.js
  const labels = chartData.map(d => {
    const fecha = new Date(d.fecha);
    return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  });

  const datasets = {
    labels,
    datasets: [
      {
        label: 'Logins Exitosos',
        data: chartData.map(d => d.logins_exitosos || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Intentos Fallidos',
        data: chartData.map(d => d.logins_fallidos || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: isDark ? '#94a3b8' : '#475569',
          font: {
            family: "'Sora', sans-serif",
            size: 12,
          },
          padding: 15,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#e2e8f0' : '#1e293b',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.3)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          footer: (tooltipItems) => {
            let sum = 0;
            tooltipItems.forEach(function(tooltipItem) {
              sum += tooltipItem.parsed.y;
            });
            return 'Total: ' + sum;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#475569',
          font: {
            family: "'Sora', sans-serif",
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? 'rgba(14, 165, 233, 0.08)' : 'rgba(14, 165, 233, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#475569',
          font: {
            family: "'Sora', sans-serif",
            size: 11,
          },
          precision: 0,
        },
      },
    },
  };

  if (loading) {
    return (
      <div style={{
        background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
        borderRadius: '16px',
        padding: '24px',
        height: '350px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{
            width: '100%',
            height: '24px',
            background: isDark
              ? 'linear-gradient(90deg, #1e3a5f 25%, #1e4976 50%, #1e3a5f 75%)'
              : 'linear-gradient(90deg, #dbeafe 25%, #bfdbfe 50%, #dbeafe 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px',
          }} />
          <div style={{
            flex: 1,
            background: isDark
              ? 'linear-gradient(90deg, #1e3a5f 25%, #1e4976 50%, #1e3a5f 75%)'
              : 'linear-gradient(90deg, #dbeafe 25%, #bfdbfe 50%, #dbeafe 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '8px',
          }} />
        </div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{
        background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
        borderRadius: '16px',
        padding: '24px',
        height: '350px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: '14px',
          margin: 0,
        }}>
          No hay datos disponibles para mostrar
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
      borderRadius: '16px',
      padding: '24px',
      height: '350px',
    }}>
      <h3 style={{
        color: isDark ? '#e2e8f0' : '#0c4a6e',
        fontSize: '16px',
        fontWeight: 700,
        margin: '0 0 20px 0',
        letterSpacing: '-0.3px',
      }}>
        Historial de Inicios de Sesión
      </h3>
      <div style={{ height: 'calc(100% - 44px)' }}>
        <Line data={datasets} options={options} />
      </div>
    </div>
  );
}
