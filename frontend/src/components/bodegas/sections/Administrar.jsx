// src/components/bodegas/sections/Administrar.jsx
import React from 'react';
import { BuildingStorefrontIcon, SparklesIcon, ArrowPathRoundedSquareIcon, AdjustmentsHorizontalIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import '../../../styles/bodegas-responsive.css';

export default function Administrar({ sucursalSel, handleTabChange }) {
  return (
    <div className="bg-white/80 dark:!bg-slate-900/80 backdrop-blur-sm rounded-xl p-2 sm:p-3 md:p-4 lg:p-5 border border-white/20 dark:!border-slate-800 shadow-lg w-full">
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
        <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg" style={{
          width: 'clamp(2rem, 5vw, 2.5rem)',
          height: 'clamp(2rem, 5vw, 2.5rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AdjustmentsHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-800 dark:!text-slate-100 leading-tight">
            Centro de Administración
          </h3>
          <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:!text-slate-400 truncate">
            Gestiona operaciones de {sucursalSel?.nombre}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {[
          { title: "Crear Nueva Bodega", description: "Configura espacios de almacenamiento adicionales", icon: BuildingStorefrontIcon, color: "from-blue-600 to-blue-500", action: () => handleTabChange('crear-bodega') },
          { title: "Ajustar Inventarios", description: "Modifica existencias y corrige discrepancias", icon: SparklesIcon, color: "from-blue-600 to-blue-500", action: () => handleTabChange('ajustar-existencia') },
          { title: "Gestionar Traslados", description: "Coordina movimientos entre bodegas", icon: ArrowPathRoundedSquareIcon, color: "from-blue-600 to-blue-500", action: () => handleTabChange('realizar-traslado') },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <button
              key={index}
              onClick={card.action}
              className="group touch-target text-left p-2.5 sm:p-3 md:p-3.5 lg:p-4 bg-white/60 dark:!bg-slate-800/60 hover:bg-white/80 dark:hover:!bg-slate-700/80 rounded-xl border border-slate-200/60 dark:!border-slate-700/60 hover:border-slate-300/60 dark:hover:border-slate-600/60 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-[1.03] md:hover:scale-105 hover:shadow-lg active:scale-95"
              style={{
                minHeight: 'clamp(5.5rem, 13vw, 7.5rem)'
              }}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center mb-1.5 sm:mb-2 md:mb-2.5 lg:mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <h4 className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 dark:!text-slate-100 mb-0.5 sm:mb-1 line-clamp-1">
                {card.title}
              </h4>
              <p className="text-[10px] sm:text-xs md:text-sm text-slate-600 dark:!text-slate-400 line-clamp-2">
                {card.description}
              </p>
              <div className="mt-1.5 sm:mt-2 md:mt-2.5 lg:mt-3 flex items-center text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-medium group-hover:gap-2 transition-all duration-300">
                Acceder <ChevronRightIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
