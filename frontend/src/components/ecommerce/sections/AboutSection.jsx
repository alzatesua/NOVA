import React from 'react';
import { COLORS, DARK_COLORS } from '../constants/colors';

/**
 * AboutSection - Sección "Nosotros" del ecommerce
 *
 * Muestra información sobre la empresa, misión y beneficios
 */
export default function AboutSection({ activeSection, nombreTienda = 'Nova', darkMode = false }) {
  // Solo renderizar si esta sección está activa
  if (activeSection !== 'nosotros') {
    return null;
  }

  return (
    <div className="py-8 sm:py-12 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 text-center"
            style={{ color: darkMode ? DARK_COLORS.textPrimary : COLORS.verdeOscuro }}>
          Sobre Nosotros
        </h1>

        <div className="rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
             style={{ backgroundColor: darkMode ? DARK_COLORS.cardBackground : COLORS.beigeCrema }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: COLORS.verdePrincipal }}>
            Nuestra Misión
          </h2>
          <p className="text-base sm:text-lg leading-relaxed mb-4 sm:mb-6"
             style={{ color: darkMode ? DARK_COLORS.textSecondary : COLORS.grisOscuro }}>
            En {nombreTienda}, estamos comprometidos con revolucionar la forma en que las personas se mueven.
            Nuestra misión es proporcionar soluciones de movilidad eléctrica accesibles, sostenibles y de alta calidad
            que contribuyan a un futuro más limpio y verde para todos.
          </p>

          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: COLORS.verdePrincipal }}>
            Por Qué Elegirnos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <div className="text-center p-3 sm:p-4">
              <div className="text-4xl sm:text-5xl mb-2">🌱</div>
              <h3 className="font-bold text-base sm:text-lg mb-2"
                  style={{ color: COLORS.verdeOscuro }}>100% Ecológico</h3>
              <p className="text-xs sm:text-sm"
                 style={{ color: darkMode ? DARK_COLORS.textSecondary : COLORS.grisMedio }}>
                Todos nuestros productos son cero emisiones
              </p>
            </div>
            <div className="text-center p-3 sm:p-4">
              <div className="text-4xl sm:text-5xl mb-2">⚡</div>
              <h3 className="font-bold text-base sm:text-lg mb-2"
                  style={{ color: COLORS.verdeOscuro }}>Alta Potencia</h3>
              <p className="text-xs sm:text-sm"
                 style={{ color: darkMode ? DARK_COLORS.textSecondary : COLORS.grisMedio }}>
                Baterías de larga duración y rendimiento
              </p>
            </div>
            <div className="text-center p-3 sm:p-4">
              <div className="text-4xl sm:text-5xl mb-2">🛡️</div>
              <h3 className="font-bold text-base sm:text-lg mb-2"
                  style={{ color: COLORS.verdeOscuro }}>Garantía Premium</h3>
              <p className="text-xs sm:text-sm"
                 style={{ color: darkMode ? DARK_COLORS.textSecondary : COLORS.grisMedio }}>
                Soporte técnico y garantía extendida
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl shadow-xl p-4 sm:p-6 md:p-8"
             style={{ backgroundColor: darkMode ? DARK_COLORS.cardBackground : COLORS.verdeMenta + '20' }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: COLORS.verdePrincipal }}>
            Nuestro Compromiso Ambiental
          </h2>
          <p className="text-base sm:text-lg leading-relaxed"
             style={{ color: darkMode ? DARK_COLORS.textSecondary : COLORS.grisOscuro }}>
            Cada producto que vendemos ayuda a reducir la huella de carbono. Trabajamos directamente con
            fabricantes que utilizan materiales reciclables y procesos de producción sostenibles.
            Además, donamos el 5% de nuestras utilidades a organizaciones dedicadas a la reforestación
            y conservación del medio ambiente.
          </p>
        </div>
      </div>
    </div>
  );
}
