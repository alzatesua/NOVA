import React from 'react';

/**
 * NovaFooter - Footer para la aplicación Nova con branding DAGI y efecto de destellos
 */
export default function NovaFooter() {
  return (
    <>
      {/* Estilos para animaciones de destellos */}
      <style>{`
        @keyframes sparkle1 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(10px, -10px); }
        }

        @keyframes sparkle2 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-15px, 5px); }
        }

        @keyframes sparkle3 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(8px, 12px); }
        }

        @keyframes sparkle4 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-12px, -8px); }
        }

        @keyframes sparkle5 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(12px, -8px); }
        }

        @keyframes sparkle6 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(-10px, 10px); }
        }

        @keyframes sparkle7 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(15px, -15px); }
        }

        @keyframes sparkle8 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(-18px, 12px); }
        }

        .animate-sparkle1 { animation: sparkle1 3s ease-in-out infinite; }
        .animate-sparkle2 { animation: sparkle2 4s ease-in-out infinite 0.5s; }
        .animate-sparkle3 { animation: sparkle3 3.5s ease-in-out infinite 1s; }
        .animate-sparkle4 { animation: sparkle4 4.5s ease-in-out infinite 1.5s; }
        .animate-sparkle5 { animation: sparkle5 2.8s ease-in-out infinite 0.3s; }
        .animate-sparkle6 { animation: sparkle6 3.1s ease-in-out infinite 0.7s; }
        .animate-sparkle7 { animation: sparkle7 3.5s ease-in-out infinite 0.2s; }
        .animate-sparkle8 { animation: sparkle8 3.2s ease-in-out infinite 1.3s; }
      `}</style>

      <footer className="bg-white dark:!bg-slate-900 border-t border-slate-200 dark:!border-slate-800 mt-auto relative overflow-hidden">
        {/* Destellos animados */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Pequeños destellos - 1px */}
          <div className="absolute top-[10%] left-[5%] w-1 h-1 bg-blue-400 dark:!bg-blue-300 rounded-full animate-sparkle1"></div>
          <div className="absolute top-[20%] left-[15%] w-1 h-1 bg-cyan-400 dark:!bg-cyan-300 rounded-full animate-sparkle2"></div>
          <div className="absolute top-[30%] right-[10%] w-1 h-1 bg-purple-400 dark:!bg-purple-300 rounded-full animate-sparkle3"></div>
          <div className="absolute top-[40%] right-[20%] w-1 h-1 bg-blue-300 dark:!bg-blue-200 rounded-full animate-sparkle4"></div>
          <div className="absolute top-[60%] left-[8%] w-1 h-1 bg-cyan-300 dark:!bg-cyan-200 rounded-full animate-sparkle1"></div>
          <div className="absolute top-[70%] right-[15%] w-1 h-1 bg-purple-300 dark:!bg-purple-200 rounded-full animate-sparkle2"></div>
          <div className="absolute top-[80%] left-[12%] w-1 h-1 bg-blue-400 dark:!bg-blue-300 rounded-full animate-sparkle3"></div>
          <div className="absolute top-[90%] right-[8%] w-1 h-1 bg-cyan-400 dark:!bg-cyan-300 rounded-full animate-sparkle4"></div>

          {/* Destellos medios - 2px */}
          <div className="absolute top-[25%] left-[30%] w-2 h-2 bg-blue-500 dark:!bg-blue-400 rounded-full animate-sparkle5"></div>
          <div className="absolute top-[50%] right-[25%] w-2 h-2 bg-cyan-500 dark:!bg-cyan-400 rounded-full animate-sparkle6"></div>
          <div className="absolute top-[75%] left-[35%] w-2 h-2 bg-purple-500 dark:!bg-purple-400 rounded-full animate-sparkle1"></div>

          {/* Destellos grandes - 3px */}
          <div className="absolute top-[35%] left-[50%] w-3 h-3 bg-blue-500 dark:!bg-blue-400 rounded-full animate-sparkle7"></div>
          <div className="absolute top-[65%] right-[45%] w-3 h-3 bg-cyan-500 dark:!bg-cyan-400 rounded-full animate-sparkle8"></div>
        </div>

        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-center gap-6">
            {/* Logo DAGI - Elemento independiente al costado */}
            <img
              src="/logo-dagi.png"
              alt="DAGI Logo"
              className="h-20 w-auto object-contain"
            />

            {/* Textos alineados verticalmente */}
            <div className="flex flex-col items-center">
              {/* Texto de branding */}
              <p className="text-sm text-slate-600 dark:!text-slate-400 text-center">
                Nova - Aplicación desarrollada por{' '}
                <span className="font-semibold text-slate-900 dark:!text-slate-100">DAGI</span>
              </p>

              {/* Copyright alineado */}
              <p className="text-xs text-slate-500 dark:!text-slate-500 text-center">
                © {new Date().getFullYear()} Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
