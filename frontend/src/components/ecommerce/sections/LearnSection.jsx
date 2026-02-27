import React from 'react';
import { COLORS, DARK_COLORS } from '../constants/colors';

/**
 * LearnSection - Sección "Infórmate" del ecommerce
 * Diseño moderno y tecnológico para información sobre vehículos eléctricos
 */
export default function LearnSection({ activeSection, darkMode = false }) {
  if (activeSection !== 'infórmate') {
    return null;
  }

  // Estilos inline para asegurar visibilidad en modo oscuro
  const sectionBg = darkMode ? DARK_COLORS.background : '#f0fdf4';
  const titleColor = darkMode ? '#22c55e' : COLORS.verdePrincipal;
  const subtitleColor = darkMode ? DARK_COLORS.textSecondary : COLORS.grisOscuro;
  const cardBg = darkMode ? DARK_COLORS.cardBackground : '#ffffff';
  const cardBorder = darkMode ? '#22c55e' : COLORS.verdeMenta;
  const itemBg = darkMode ? 'rgba(34, 197, 94, 0.1)' : '#f0fdf4';
  const textColor = darkMode ? DARK_COLORS.textPrimary : COLORS.negro;
  const textMuted = darkMode ? DARK_COLORS.textSecondary : COLORS.grisMedio;
  const iconBg = darkMode ? 'rgba(34, 197, 94, 0.2)' : COLORS.verdeMenta;

  return (
    <div style={{ backgroundColor: sectionBg, minHeight: '100vh', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-block',
            padding: '0.5rem 1.5rem',
            borderRadius: '50px',
            background: `linear-gradient(135deg, ${darkMode ? '#22c55e' : COLORS.verdePrincipal}, ${darkMode ? '#16a34a' : COLORS.verdeOscuro})`,
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: '600',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            ⚡ Guía Completa Colombia 2025
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: '800',
            marginBottom: '1rem',
            background: `linear-gradient(135deg, ${titleColor}, ${darkMode ? '#86efac' : COLORS.verdeSecundario})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Vehículos Eléctricos
          </h1>
          <p style={{ fontSize: '1.25rem', color: subtitleColor, maxWidth: '700px', margin: '0 auto' }}>
            Todo lo que necesitas saber sobre la legalidad, requisitos y beneficios de la movilidad eléctrica en Colombia 🇨🇴
          </p>
        </div>

        {/* Tarjetas de Clasificación */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            color: titleColor,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '2rem' }}>🛵</span>
            Clasificación de Vehículos
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            {/* Bicicleta */}
            <div style={{
              background: cardBg,
              border: `2px solid ${cardBorder}`,
              borderRadius: '1.5rem',
              padding: '1.5rem',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 20px 50px rgba(34, 197, 94, 0.2)' : '0 20px 40px rgba(34, 197, 94, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>🚴</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: textColor }}>
                Bicicleta Eléctrica
              </h3>
              <div style={{ fontSize: '0.875rem', color: textMuted, lineHeight: '1.8' }}>
                <div>⚡ Potencia: &lt;250W</div>
                <div>🏃 Velocidad: ≤25 km/h</div>
                <div>✅ <strong style={{ color: titleColor }}>Sin licencia</strong></div>
                <div>✅ <strong style={{ color: titleColor }}>Sin SOAT</strong></div>
                <div>✅ <strong style={{ color: titleColor }}>Sin matrícula</strong></div>
              </div>
            </div>

            {/* Motocicleta */}
            <div style={{
              background: cardBg,
              border: `2px solid ${cardBorder}`,
              borderRadius: '1.5rem',
              padding: '1.5rem',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 20px 50px rgba(34, 197, 94, 0.2)' : '0 20px 40px rgba(34, 197, 94, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>🏍️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: textColor }}>
                Motocicleta Eléctrica
              </h3>
              <div style={{ fontSize: '0.875rem', color: textMuted, lineHeight: '1.8' }}>
                <div>⚡ Potencia: &gt;250W</div>
                <div>🏍 Velocidad: &gt;25 km/h</div>
                <div>📋 <strong style={{ color: textColor }}>Con licencia B1/B2</strong></div>
                <div>🏷️ <strong style={{ color: textColor }}>Con SOAT</strong></div>
                <div>📝 <strong style={{ color: textColor }}>Con matrícula</strong></div>
              </div>
            </div>

            {/* Scooter */}
            <div style={{
              background: cardBg,
              border: `2px solid ${cardBorder}`,
              borderRadius: '1.5rem',
              padding: '1.5rem',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 20px 50px rgba(34, 197, 94, 0.2)' : '0 20px 40px rgba(34, 197, 94, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>🛺</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: textColor }}>
                Scooter Eléctrico
              </h3>
              <div style={{ fontSize: '0.875rem', color: textMuted, lineHeight: '1.8' }}>
                <div>⚡ Potencia: Variable</div>
                <div>🛺 Velocidad: 45-55 km/h</div>
                <div>📋 <strong style={{ color: textColor }}>Licencia B1</strong></div>
                <div>🏷️ <strong style={{ color: textColor }}>Con SOAT</strong></div>
                <div>💰 <strong style={{ color: titleColor }}>Beneficios tributarios</strong></div>
              </div>
            </div>

            {/* Monopatín */}
            <div style={{
              background: cardBg,
              border: `2px solid ${cardBorder}`,
              borderRadius: '1.5rem',
              padding: '1.5rem',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer',
              boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = darkMode ? '0 20px 50px rgba(34, 197, 94, 0.2)' : '0 20px 40px rgba(34, 197, 94, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)';
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '15px',
                background: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem'
              }}>🛹</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.75rem', color: textColor }}>
                Monopatín Eléctrico
              </h3>
              <div style={{ fontSize: '0.875rem', color: textMuted, lineHeight: '1.8' }}>
                <div>⚡ Potencia: &lt;500W</div>
                <div>🛹 Velocidad: ≤25 km/h</div>
                <div>📍 <strong style={{ color: textColor }}>Ciclovías</strong></div>
                <div>👤 <strong style={{ color: textColor }}>Casco obligatorio</strong></div>
                <div>🔞 <strong style={{ color: textColor }}>Edad mín: 14 años</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Requisitos y Documentos - Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Requisitos */}
          <div style={{
            background: cardBg,
            border: `2px solid ${cardBorder}`,
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: titleColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{
                padding: '0.5rem',
                borderRadius: '10px',
                background: iconBg,
                fontSize: '1.5rem'
              }}>📋</span>
              Requisitos de Matrícula
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🪪', title: 'Licencia', desc: 'Categoría B1 o B2 según vehículo' },
                { icon: '🏷️', title: 'Matrícula', desc: 'Trámite ante RUNT' },
                { icon: '🏥', title: 'SOAT', desc: 'Seguro obligatorio anual' },
                { icon: '🔧', title: 'Tecnomecánica', desc: 'Revisión cada 6-12 meses' },
                { icon: '💰', title: 'Impuesto', desc: 'Exento o tarifa reducida' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: itemBg,
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', color: textColor, marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.875rem', color: textMuted }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos */}
          <div style={{
            background: cardBg,
            border: `2px solid ${cardBorder}`,
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              marginBottom: '1.5rem',
              color: titleColor,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{
                padding: '0.5rem',
                borderRadius: '10px',
                background: iconBg,
                fontSize: '1.5rem'
              }}>📑</span>
              Documentos Requeridos
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: '🧾', title: 'Factura', desc: 'Compra original o autenticada' },
                { icon: '✅', title: 'Certificado', desc: 'De conformidad del fabricante' },
                { icon: '📋', title: 'Cédula', desc: 'Del propietario del vehículo' },
                { icon: '🏠', title: 'Residencia', desc: 'Certificado para trámites locales' },
                { icon: '📸', title: 'Fotos', desc: '4 vistas del vehículo' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: itemBg,
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', color: textColor, marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.875rem', color: textMuted }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Beneficios - Banner destacado */}
        <div style={{
          background: `linear-gradient(135deg, ${darkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)'}, ${darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)'})`,
          border: `2px solid ${darkMode ? '#22c55e' : COLORS.verdePrincipal}`,
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '3rem',
          boxShadow: darkMode ? '0 15px 50px rgba(34, 197, 94, 0.15)' : '0 15px 40px rgba(34, 197, 94, 0.1)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '800',
            marginBottom: '2rem',
            textAlign: 'center',
            background: `linear-gradient(135deg, ${titleColor}, ${darkMode ? '#3b82f6' : '#22c55e'})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🎁 Beneficios Exclusivos
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1.5rem'
          }}>
            {[
              { icon: '💸', title: 'Sin IVA', desc: 'Vehículos 100% eléctricos' },
              { icon: '🚗', title: 'Pico y Placa', desc: 'Exención total o parcial' },
              { icon: '💵', title: 'Impuesto', desc: 'Descuentos hasta 100%' },
              { icon: '🅿️', title: 'Parqueo', desc: 'Gratis en muchos lugares' },
              { icon: '🔌', title: 'Electrolineras', desc: 'Red en expansión' },
              { icon: '🚦', title: 'Prioridad', desc: 'Carriles exclusivos' }
            ].map((item, idx) => (
              <div key={idx} style={{
                background: cardBg,
                padding: '1.5rem',
                borderRadius: '1rem',
                textAlign: 'center',
                transition: 'transform 0.3s',
                border: `1px solid ${cardBorder}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
                <div style={{ fontWeight: '700', color: textColor, marginBottom: '0.5rem' }}>{item.title}</div>
                <div style={{ fontSize: '0.8rem', color: textMuted }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Normas de Circulación */}
        <div style={{
          background: cardBg,
          border: `2px solid ${cardBorder}`,
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '3rem',
          boxShadow: darkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            color: titleColor,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{
              padding: '0.5rem',
              borderRadius: '10px',
              background: iconBg,
              fontSize: '1.5rem'
            }}>🚦</span>
            Normas de Circulación
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { icon: '🚴', title: 'Ciclovías', desc: 'Bicicletas eléctricas pueden usar ciclovías exclusivas' },
              { icon: '🛣️', title: 'Vías principales', desc: 'Carril de motos o extremo derecho' },
              { icon: '⛑️', title: 'Seguridad', desc: 'Casco obligatorio, chaleco reflectivo recomendado' },
              { icon: '📵', title: 'Celular', desc: 'Prohibido auriculares y manipular dispositivos' }
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '1.25rem',
                borderRadius: '12px',
                background: itemBg,
                border: `1px solid ${darkMode ? 'rgba(34, 197, 94, 0.2)' : COLORS.verdeMenta}`
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: '700', color: textColor, marginBottom: '0.5rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.875rem', color: textMuted, lineHeight: '1.5' }}>{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fuentes Oficiales */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.verdePrincipal}, ${COLORS.verdeOscuro})`,
          borderRadius: '1.5rem',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 15px 40px rgba(34, 197, 94, 0.3)'
        }}>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            marginBottom: '2rem',
            textAlign: 'center',
            color: '#ffffff'
          }}>
            📚 Fuentes Oficiales
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { icon: '🏛️', name: 'MinTransporte', url: 'https://www.mintransporte.gov.co/' },
              { icon: '🚗', name: 'RUNT', url: 'https://www.runt.gov.co/' },
              { icon: '💳', name: 'DIAN', url: 'https://www.ant.gov.co/' },
              { icon: '🌱', name: 'MinAmbiente', url: 'https://www.medioambiente.gov.co/' }
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '1.5rem',
                  borderRadius: '1rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'transform 0.3s, background 0.3s',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <div style={{ color: '#ffffff', fontWeight: '700' }}>{item.name}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Nota Importante */}
        <div style={{
          background: darkMode ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)',
          borderLeft: `4px solid ${COLORS.acentoNaranja}`,
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: '700', color: textColor, marginBottom: '0.5rem' }}>Nota Importante</div>
              <div style={{ fontSize: '0.95rem', color: textMuted, lineHeight: '1.6' }}>
                La normativa puede variar según el municipio. Te recomendamos verificar con las autoridades locales de tránsito para obtener información actualizada de tu ciudad. Esta información es referencial y puede estar sujeta a cambios.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
