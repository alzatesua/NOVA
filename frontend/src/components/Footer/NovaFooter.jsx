import React from 'react';

/**
 * NovaFooter - Footer para la aplicación Nova con branding DAGI
 */
export default function NovaFooter() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo y información DAGI */}
          <div className="flex items-center gap-4">
            {/* Logo DAGI SVG */}
            <div className="flex-shrink-0">
              <svg
                width="120"
                height="40"
                viewBox="0 0 120 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="dark:invert"
              >
                {/* Bear head icon with D */}
                <g transform="translate(5, 5)">
                  {/* Main circle background */}
                  <circle cx="15" cy="15" r="15" fill="currentColor"/>

                  {/* Bear head silhouette */}
                  <path
                    d="M15 6C11 6 8 8 7 10C6 12 6 14 7 16C8 18 10 20 12 21C11 22 10 23 10 24C10 25 11 26 12 26C13 26 14 25 15 24C16 25 17 26 18 26C19 26 20 25 20 24C20 23 19 22 18 21C20 20 22 18 23 16C24 14 24 12 23 10C22 8 19 6 15 6ZM15 10C17 10 18 11 18 13C18 15 17 16 15 16C13 16 12 15 12 13C12 11 13 10 15 10Z"
                    fill="white"
                  />
                </g>

                {/* DAGI text */}
                <text
                  x="35"
                  y="26"
                  fontFamily="Arial, sans-serif"
                  fontSize="18"
                  fontWeight="bold"
                  fill="currentColor"
                >
                  DAGI
                </text>
              </svg>
            </div>

            {/* Texto de branding */}
            <div className="text-center md:text-left">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Nova - Aplicación desarrollada por{' '}
                <span className="font-semibold text-slate-900 dark:text-slate-100">DAGI</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                © {new Date().getFullYear()} Todos los derechos reservados
              </p>
            </div>
          </div>

          {/* Información adicional */}
          <div className="text-center md:text-right">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Sistema de Gestión Integral
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
              Versión 1.0.0
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
