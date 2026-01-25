// src/components/bodegas/BodegasHeader.jsx
import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/solid';

export default function BodegasHeader({ SECCIONES, active, handleTabChange, sucursalSel }) {
  const currentSection = SECCIONES.find(s => s.id === active);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar vertical izquierdo */}
      <div className="w-16 bg-slate-800/95 backdrop-blur-xl flex flex-col items-center py-6 space-y-3 shadow-2xl border-r border-slate-700/50">
        {SECCIONES.map(section => {
          const Icon = section.icon;
          const isActive = active === section.id;

          return (
            <button
              key={section.id}
              onClick={() => handleTabChange(section.id)}
              className={`group relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-br ${section.color} text-white shadow-lg shadow-indigo-500/25`
                  : 'bg-slate-700/60 hover:bg-slate-600/80 text-slate-300 hover:text-white border border-slate-600/40'
              }`}
            >
              {/* Indicador activo */}
              {isActive && (
                <div className={`absolute -left-4 w-1 h-8 bg-gradient-to-b ${section.color} rounded-r-full`}>
                  <div className="w-full h-3 bg-white/30 rounded-full animate-pulse"></div>
                </div>
              )}

              {/* Efecto glassmorphism en hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-xl"></div>
              
              <Icon className={`w-6 h-6 transition-transform duration-300 relative z-10 ${
                isActive ? 'scale-110' : 'group-hover:scale-110'
              }`} />
              
              {/* Tooltip */}
              <div className="absolute left-16 ml-3 px-3 py-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 shadow-xl text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-50 font-medium">
                {section.label}
                <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-slate-800/95 border-l border-t border-slate-600/50 rotate-45"></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Área principal con tu header original */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-indigo-50/30">
        {/* Tu header original mantenido exactamente igual */}
        <header className="relative mb-8 sticky top-0 z-20 bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl mx-6 mt-6">
          <div className="flex items-start gap-6">
            <div className={`w-2 h-20 rounded-full bg-gradient-to-b transition-all duration-500 ${currentSection?.color}`}>
              <div className="w-full h-8 bg-white/30 rounded-full animate-pulse"></div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full font-medium">
                  Gestión de Inventario
                </span>
                <ChevronRightIcon className="w-3 h-3" />
                <span className="font-medium text-indigo-600 text-sm">
                  {sucursalSel?.nombre || 'Sucursal'}
                </span>
              </div>

              <h6 className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3 leading-snug">
                {currentSection?.label}
              </h6>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {SECCIONES.map(section => {
                  const Icon = section.icon;
                  const isActive = active === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => handleTabChange(section.id)}
                      className={`group relative overflow-hidden rounded-xl p-3 transition-all duration-300 transform hover:scale-105 ${
                        isActive
                          ? `bg-gradient-to-br ${section.color} text-white shadow-lg shadow-indigo-500/25`
                          : 'bg-white/60 hover:bg-white/80 text-slate-700 border border-slate-200/60'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <div className="relative z-10">
                        <Icon className={`w-5 h-5 mx-auto mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <p className="text-xs font-medium text-center leading-tight">{section.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Área de contenido */}
        <div className="px-6 pb-6">
          {/* Aquí va el contenido de cada sección */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl p-6 min-h-96">
            <div className="flex items-start gap-4">
              <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${currentSection?.color}`}></div>
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {currentSection?.label}
                </h2>
                <p className="text-slate-600 text-sm mt-1">
                  Contenido de la sección activa
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}