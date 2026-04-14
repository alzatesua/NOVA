import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

const StatusIcon = ({ exitoso }) => {
  if (exitoso) {
    return (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#10b981' }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18, color: '#ef4444' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
};

export default function LoginHistoryTable({ data = [], loading = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleLabel = (rol) => {
    const roles = {
      'admin': 'Administrador',
      'almacen': 'Encargado de Almacén',
      'vendedor': 'Vendedor',
      'operario': 'Operario',
    };
    return roles[rol] || rol;
  };

  if (loading) {
    return (
      <div style={{
        background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
        borderRadius: '16px',
        padding: '20px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              style={{
                height: '60px',
                background: isDark
                  ? 'linear-gradient(90deg, #1e3a5f 25%, #1e4976 50%, #1e3a5f 75%)'
                  : 'linear-gradient(90deg, #dbeafe 25%, #bfdbfe 50%, #dbeafe 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: '8px',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{
        background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
        borderRadius: '16px',
        padding: '40px',
        textAlign: 'center',
      }}>
        <p style={{
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: '14px',
          margin: 0,
        }}>
          No hay registros de login para mostrar
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
      borderRadius: '16px',
      padding: '20px',
    }}>
      <h3 style={{
        color: isDark ? '#e2e8f0' : '#0c4a6e',
        fontSize: '16px',
        fontWeight: 700,
        margin: '0 0 20px 0',
        letterSpacing: '-0.3px',
      }}>
        Detalle de Sesiones
      </h3>

      {/* Desktop/Tablet View - Tabla con scroll horizontal */}
      <div className="desktop-table" style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '13px',
        }}>
          <thead>
            <tr style={{
              borderBottom: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
            }}>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Usuario</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Login</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Logout</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Duración</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'left',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Estado</th>
              <th style={{
                padding: '12px 8px',
                textAlign: 'center',
                color: isDark ? '#94a3b8' : '#475569',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const isExpanded = expandedRows.has(row.id);
              const isActive = !row.fecha_hora_logout;

              return (
                <React.Fragment key={row.id}>
                  <tr
                    style={{
                      borderBottom: `1px solid ${isDark ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.1)'}`,
                      backgroundColor: isActive
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'rgba(16, 185, 129, 0.08)'
                        : 'transparent',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <div>
                        <div style={{
                          color: isDark ? '#e2e8f0' : '#0c4a6e',
                          fontWeight: 600,
                          marginBottom: '2px',
                        }}>
                          {row.usuario}
                        </div>
                        <div style={{
                          color: isDark ? '#94a3b8' : '#64748b',
                          fontSize: '11px',
                        }}>
                          {getRoleLabel(row.rol)}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', color: isDark ? '#94a3b8' : '#475569' }}>
                      {formatDate(row.fecha_hora_login)}
                    </td>
                    <td style={{ padding: '12px 8px', color: isDark ? '#94a3b8' : '#475569' }}>
                      {isActive ? (
                        <span style={{
                          color: '#10b981',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}>
                          Activa
                        </span>
                      ) : (
                        formatDate(row.fecha_hora_logout)
                      )}
                    </td>
                    <td style={{ padding: '12px 8px', color: isDark ? '#94a3b8' : '#475569' }}>
                      {formatDuration(row.duracion_segundos)}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <StatusIcon exitoso={row.exitoso} />
                        <span style={{
                          color: row.exitoso ? '#10b981' : '#ef4444',
                          fontWeight: 500,
                          fontSize: '12px',
                        }}>
                          {row.exitoso ? 'Exitoso' : 'Fallido'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleRow(row.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          color: isDark ? '#38bdf8' : '#0284c7',
                          transition: 'transform 0.2s ease',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0' }}>
                        <div style={{
                          padding: '16px',
                          background: isDark ? 'rgba(14,165,233,0.05)' : 'rgba(14,165,233,0.03)',
                          borderTop: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
                        }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            fontSize: '12px',
                          }}>
                            <div>
                              <div style={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                marginBottom: '4px',
                                fontWeight: 600,
                              }}>
                                Dirección IP:
                              </div>
                              <div style={{
                                color: isDark ? '#e2e8f0' : '#0c4a6e',
                                fontFamily: 'monospace',
                              }}>
                                {row.direccion_ip}
                              </div>
                            </div>
                            <div>
                              <div style={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                marginBottom: '4px',
                                fontWeight: 600,
                              }}>
                                Correo:
                              </div>
                              <div style={{
                                color: isDark ? '#e2e8f0' : '#0c4a6e',
                                wordBreak: 'break-all',
                              }}>
                                {row.correo_usuario}
                              </div>
                            </div>
                            {!row.exitoso && row.fallo_reason && (
                              <div>
                                <div style={{
                                  color: isDark ? '#94a3b8' : '#64748b',
                                  marginBottom: '4px',
                                  fontWeight: 600,
                                }}>
                                  Razón del Fallo:
                                </div>
                                <div style={{
                                  color: '#ef4444',
                                }}>
                                  {row.fallo_reason}
                                </div>
                              </div>
                            )}
                            <div>
                              <div style={{
                                color: isDark ? '#94a3b8' : '#64748b',
                                marginBottom: '4px',
                                fontWeight: 600,
                              }}>
                                User Agent:
                              </div>
                              <div style={{
                                color: isDark ? '#e2e8f0' : '#0c4a6e',
                                fontSize: '11px',
                                wordBreak: 'break-all',
                                opacity: 0.8,
                              }}>
                                {row.user_agent?.substring(0, 100)}
                                {row.user_agent && row.user_agent.length > 100 ? '...' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Tarjetas apiladas */}
      <div className="mobile-cards" style={{ display: 'none' }}>
        {data.map((row) => {
          const isExpanded = expandedRows.has(row.id);
          const isActive = !row.fecha_hora_logout;

          return (
            <div
              key={row.id}
              style={{
                background: isActive
                  ? isDark
                    ? 'rgba(16, 185, 129, 0.05)'
                    : 'rgba(16, 185, 129, 0.08)'
                  : 'transparent',
                border: `1px solid ${isDark ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.1)'}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                transition: 'background-color 0.2s ease',
              }}
            >
              {/* Usuario */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                }}>
                  Usuario
                </div>
                <div style={{
                  color: isDark ? '#e2e8f0' : '#0c4a6e',
                  fontWeight: 600,
                  marginBottom: '2px',
                }}>
                  {row.usuario}
                </div>
                <div style={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: '11px',
                }}>
                  {getRoleLabel(row.rol)}
                </div>
              </div>

              {/* Login y Logout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}>
                    Login
                  </div>
                  <div style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '12px' }}>
                    {formatDate(row.fecha_hora_login)}
                  </div>
                </div>
                <div>
                  <div style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}>
                    Logout
                  </div>
                  <div style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '12px' }}>
                    {isActive ? (
                      <span style={{
                        color: '#10b981',
                        fontWeight: 600,
                      }}>
                        Activa
                      </span>
                    ) : (
                      formatDate(row.fecha_hora_logout)
                    )}
                  </div>
                </div>
              </div>

              {/* Duración y Estado */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}>
                    Duración
                  </div>
                  <div style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '12px' }}>
                    {formatDuration(row.duracion_segundos)}
                  </div>
                </div>
                <div>
                  <div style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '4px',
                  }}>
                    Estado
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <StatusIcon exitoso={row.exitoso} />
                    <span style={{
                      color: row.exitoso ? '#10b981' : '#ef4444',
                      fontWeight: 500,
                      fontSize: '12px',
                    }}>
                      {row.exitoso ? 'Exitoso' : 'Fallido'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de detalles */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => toggleRow(row.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: isDark ? '#38bdf8' : '#0284c7',
                    transition: 'transform 0.2s ease',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 20, height: 20 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Detalles expandidos */}
              {isExpanded && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: isDark ? 'rgba(14,165,233,0.05)' : 'rgba(14,165,233,0.03)',
                  borderTop: `1px solid ${isDark ? 'rgba(14,165,233,0.18)' : 'rgba(14,165,233,0.25)'}`,
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '12px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}>
                        Dirección IP:
                      </div>
                      <div style={{
                        color: isDark ? '#e2e8f0' : '#0c4a6e',
                        fontFamily: 'monospace',
                      }}>
                        {row.direccion_ip}
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}>
                        Correo:
                      </div>
                      <div style={{
                        color: isDark ? '#e2e8f0' : '#0c4a6e',
                        wordBreak: 'break-all',
                      }}>
                        {row.correo_usuario}
                      </div>
                    </div>
                    {!row.exitoso && row.fallo_reason && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          color: isDark ? '#94a3b8' : '#64748b',
                          marginBottom: '4px',
                          fontWeight: 600,
                        }}>
                          Razón del Fallo:
                        </div>
                        <div style={{ color: '#ef4444' }}>
                          {row.fallo_reason}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{
                        color: isDark ? '#94a3b8' : '#64748b',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}>
                        User Agent:
                      </div>
                      <div style={{
                        color: isDark ? '#e2e8f0' : '#0c4a6e',
                        fontSize: '11px',
                        wordBreak: 'break-all',
                        opacity: 0.8,
                      }}>
                        {row.user_agent?.substring(0, 100)}
                        {row.user_agent && row.user_agent.length > 100 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
