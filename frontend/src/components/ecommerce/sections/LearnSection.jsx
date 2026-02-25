import React from 'react';
import { COLORS, DARK_COLORS } from '../constants/colors';

/**
 * LearnSection - Sección "Infórmate" del ecommerce
 *
 * Muestra información sobre leyes y regulaciones de vehículos eléctricos en Colombia
 */
export default function LearnSection({ activeSection, darkMode = false }) {
  // Solo renderizar si esta sección está activa
  if (activeSection !== 'infórmate') {
    return null;
  }

  // Detect dark mode from DOM for better accuracy
  const isDarkMode = darkMode || document.documentElement.classList.contains('dark');

  const bgColor = isDarkMode ? '#0a0f1a' : COLORS.verdeClaro;
  const cardBg = isDarkMode ? '#1a2332' : COLORS.blanco;
  const textColor = isDarkMode ? '#ffffff' : COLORS.grisOscuro;
  const headingColor = isDarkMode ? '#ffffff' : COLORS.verdeOscuro;
  const subCardBg = isDarkMode ? '#252f3f' : COLORS.beigeCrema;
  const subHeadingColor = isDarkMode ? '#ffffff' : COLORS.verdeOscuro;
  const lightBg = isDarkMode ? '#2a3545' : COLORS.grisClaro;

  return (
    <div className="py-8 sm:py-12 px-2 sm:px-4" style={{ backgroundColor: bgColor }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 md:mb-12 text-center"
            style={{ color: headingColor }}>
          Legislación Vehículos Eléctricos en Colombia
        </h1>

        {/* Introducción */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: cardBg }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: isDarkMode ? '#4ade80' : COLORS.verdePrincipal }}>
            ¿Qué necesitas saber?
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: textColor }}>
            En Colombia, los vehículos eléctricos como motos y bicicletas tienen una regulación especial que facilita su uso y promueve la movilidad sostenible. Conoce los requisitos y documentos necesarios para circular legalmente.
          </p>
        </div>

        {/* Clasificación de Vehículos */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: cardBg }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: isDarkMode ? '#4ade80' : COLORS.verdePrincipal }}>
            🛵 Clasificación de Vehículos Eléctricos
          </h2>
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 sm:p-5 rounded-xl" style={{ backgroundColor: subCardBg }}>
              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: subHeadingColor }}>
                Bicicletas Eléctricas
              </h3>
              <ul className="space-y-2 text-sm sm:text-base" style={{ color: textColor }}>
                <li>⚡ Potencia menor a 250W</li>
                <li>🚴 Velocidad máxima 25 km/h</li>
                <li>📋 NO requieren licencia de conducción</li>
                <li>🏷️ NO requieren SOAT</li>
                <li>📝 NO requieren matrícula</li>
                <li>✅ Consideradas como bicicletas convencionales</li>
              </ul>
            </div>

            <div className="p-4 sm:p-5 rounded-xl" style={{ backgroundColor: subCardBg }}>
              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: subHeadingColor }}>
                Motocicletas Eléctricas
              </h3>
              <ul className="space-y-2 text-sm sm:text-base" style={{ color: textColor }}>
                <li>⚡ Potencia mayor a 250W</li>
                <li>🏍 Velocidad superior a 25 km/h</li>
                <li>📋 SÍ requieren licencia de conducción</li>
                <li>🏷️ SÍ requieren SOAT</li>
                <li>📝 SÍ requieren matrícula vehicular</li>
                <li>✅ Deben circular por carriles de motos</li>
              </ul>
            </div>

            <div className="p-4 sm:p-5 rounded-xl" style={{ backgroundColor: subCardBg }}>
              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: subHeadingColor }}>
                Scooters Eléctricos
              </h3>
              <ul className="space-y-2 text-sm sm:text-base" style={{ color: textColor }}>
                <li>⚡ Potencia variable según modelo</li>
                <li>🛺 Velocidad hasta 45-55 km/h</li>
                <li>📋 Requieren licencia categoría B1</li>
                <li>🏷️ SÍ requieren SOAT</li>
                <li>📝 SÍ requieren matrícula</li>
                <li>✅ Beneficios tributarios disponibles</li>
              </ul>
            </div>

            <div className="p-4 sm:p-5 rounded-xl" style={{ backgroundColor: subCardBg }}>
              <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: subHeadingColor }}>
                Monopatines Eléctricos
              </h3>
              <ul className="space-y-2 text-sm sm:text-base" style={{ color: textColor }}>
                <li>⚡ Potencia generalmente menor a 500W</li>
                <li>🛹 Velocidad hasta 25 km/h</li>
                <li>📍 Uso preferencial en ciclovías</li>
                <li>👤 Casco obligatorio</li>
                <li>🚦 Prohibido en vías principales</li>
                <li>✅ Edad mínima: 14 años</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Requisitos Legales */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: cardBg }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: isDarkMode ? '#4ade80' : COLORS.verdePrincipal }}>
            📋 Documentos y Requisitos
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: subHeadingColor }}>
                Para Vehículos con Matrícula
              </h3>
              <ul className="space-y-3 text-sm sm:text-base" style={{ color: textColor }}>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">📄</span>
                  <span><strong>Licencia de conducción:</strong> Categoría B1 o B2 según el vehículo</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🏷️</span>
                  <span><strong>Matrícula vehicular:</strong> Trámite ante RUNT</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🏥</span>
                  <span><strong>SOAT:</strong> Seguro obligatorio anual</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🧾</span>
                  <span><strong>Tecnomecánica:</strong> Revisión cada 6-12 meses</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🎫</span>
                  <span><strong>Impuesto de rodamiento:</strong> Exento o tarifa reducida según municipio</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4" style={{ color: subHeadingColor }}>
                Documentos del Vehículo
              </h3>
              <ul className="space-y-3 text-sm sm:text-base" style={{ color: textColor }}>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">📋</span>
                  <span><strong>Factura de compra:</strong> Original o copia autenticada</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🔧</span>
                  <span><strong>Certificado de conformidad:</strong> Emitido por fabricante/importador</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">📑</span>
                  <span><strong>Documento de identidad:</strong> Cédula o ID del propietario</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🏠</span>
                  <span><strong>Certificado de residencia:</strong> Para trámites locales</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-lg">🎨</span>
                  <span><strong>Fotos del vehículo:</strong> 4 vistas para matrícula</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: isDarkMode ? '#1e3a5f' : COLORS.verdeMenta + '30' }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: isDarkMode ? '#4ade80' : COLORS.verdePrincipal }}>
            🎁 Beneficios de Vehículos Eléctricos en Colombia
          </h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center p-4">
              <div className="text-4xl sm:text-5xl mb-3">💰</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: subHeadingColor }}>
                Exento de IVA
              </h3>
              <p className="text-sm" style={{ color: textColor }}>
                Los vehículos 100% eléctricos no pagan IVA en la importación y compra
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl sm:text-5xl mb-3">🅿️</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: subHeadingColor }}>
                Pico y Placa Flexibilizado
              </h3>
              <p className="text-sm" style={{ color: textColor }}>
                Exención total o parcial de restricciones en varias ciudades
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl sm:text-5xl mb-3">🌿</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: subHeadingColor }}>
                Tarifas Reducidas
              </h3>
              <p className="text-sm" style={{ color: textColor }}>
                Impuestos de rodamiento con descuentos hasta del 100%
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl sm:text-5xl mb-3">🅿️</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: subHeadingColor }}>
                Parquederos Gratuitos
              </h3>
              <p className="text-sm" style={{ color: textColor }}>
                Zonas de parqueo gratuito en centros comerciales y edificios
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl sm:text-5xl mb-3">🔋</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: subHeadingColor }}>
                Puntos de Carga
              </h3>
              <p className="text-sm" style={{ color: textColor }}>
                Red creciente de electrolineras en estaciones de servicio
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-4xl sm:text-5xl mb-3">📜</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: subHeadingColor }}>
                Prioridad en Semáforos
              </h3>
              <p className="text-sm" style={{ color: textColor }}>
                Algunas ciudades implementan carriles exclusivos y prioridad
              </p>
            </div>
          </div>
        </div>

        {/* Normativa de Tránsito */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8" style={{ backgroundColor: cardBg }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: isDarkMode ? '#4ade80' : COLORS.verdePrincipal }}>
            🚦 Normas de Circulación
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-xl" style={{ backgroundColor: lightBg }}>
              <span className="text-3xl">🚴</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: subHeadingColor }}>Ciclovías</h3>
                <p className="text-sm sm:text-base" style={{ color: textColor }}>
                  Las bicicletas eléctricas pueden usar las ciclovías. Los scooters deben usar las vías principales según su clasificación.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-xl" style={{ backgroundColor: lightBg }}>
              <span className="text-3xl">🛣️</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: subHeadingColor }}>Vías Principales</h3>
                <p className="text-sm sm:text-base" style={{ color: textColor }}>
                  Los vehículos que requieren matrícula deben circular por el carril de motos o el extremo derecho de la vía.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-xl" style={{ backgroundColor: lightBg }}>
              <span className="text-3xl">👕</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: subHeadingColor }}>Elementos de Seguridad</h3>
                <p className="text-sm sm:text-base" style={{ color: textColor }}>
                  Casco obligatorio para todos los vehículos de dos ruedas. Chaleco reflectivo recomendado para circulación nocturna.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 rounded-xl" style={{ backgroundColor: lightBg }}>
              <span className="text-3xl">📱</span>
              <div>
                <h3 className="font-bold text-lg mb-1" style={{ color: subHeadingColor }}>Uso de Celular</h3>
                <p className="text-sm sm:text-base" style={{ color: textColor }}>
                  Prohibido el uso de auriculares o manipular dispositivos móviles mientras se conduce.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recursos Adicionales */}
        <div className="rounded-2xl shadow-xl p-6 sm:p-8" style={{ backgroundColor: COLORS.verdePrincipal }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">
            📚 Fuentes Oficiales
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://www.mintransporte.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl text-center transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              <div className="text-3xl mb-2">🏛️</div>
              <p className="text-white font-semibold">Ministerio de Transporte</p>
            </a>
            <a
              href="https://www.runt.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl text-center transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              <div className="text-3xl mb-2">🚗</div>
              <p className="text-white font-semibold">RUNT - Registro Único</p>
            </a>
            <a
              href="https://www.ant.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl text-center transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              <div className="text-3xl mb-2">💳</div>
              <p className="text-white font-semibold">DIAN - Impuestos</p>
            </a>
            <a
              href="https://www.medioambiente.gov.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl text-center transition-all hover:scale-105"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
            >
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-white font-semibold">Ministerio Ambiente</p>
            </a>
          </div>
        </div>

        {/* Nota Importante */}
        <div className="mt-8 p-4 sm:p-6 rounded-xl"
             style={{ backgroundColor: isDarkMode ? '#3d2a1f' : COLORS.acentoNaranja + '20', borderLeft: `4px solid ${COLORS.acentoNaranja}` }}>
          <p className="text-sm sm:text-base" style={{ color: isDarkMode ? '#fed7aa' : textColor }}>
            <strong>⚠️ Nota Importante:</strong> La normativa puede variar según el municipio. Te recomendamos verificar con las autoridades locales de tránsito para obtener información actualizada de tu ciudad. Esta información es referencial y puede estar sujeta a cambios.
          </p>
        </div>
      </div>
    </div>
  );
}
