// src/components/bodegas/sections/Administrar.jsx
import React from 'react';
import { BuildingStorefrontIcon, SparklesIcon, ArrowPathRoundedSquareIcon, AdjustmentsHorizontalIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function Administrar({ sucursalSel, handleTabChange }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg">
          <AdjustmentsHorizontalIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Centro de Administración</h3>
          <p className="text-xs text-slate-600">Gestiona todas las operaciones de {sucursalSel?.nombre}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Crear Nueva Bodega", description: "Configura espacios de almacenamiento adicionales", icon: BuildingStorefrontIcon, color: "from-blue-600 to-blue-500", action: () => handleTabChange('crear-bodega') },
          { title: "Ajustar Inventarios", description: "Modifica existencias y corrige discrepancias", icon: SparklesIcon, color: "from-blue-600 to-blue-500", action: () => handleTabChange('ajustar-existencia') },
          { title: "Gestionar Traslados", description: "Coordina movimientos entre bodegas", icon: ArrowPathRoundedSquareIcon, color: "from-blue-600 to-blue-500", action: () => handleTabChange('realizar-traslado') },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <button key={index} onClick={card.action} className="group text-left p-4 bg-white/60 hover:bg-white/80 rounded-xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">{card.title}</h4>
              <p className="text-xs text-slate-600">{card.description}</p>
              <div className="mt-3 flex items-center text-blue-600 text-xs font-medium group-hover:gap-2 transition-all duration-300">
                Acceder <ChevronRightIcon className="w-3.5 h-3.5 ml-1 group-hover:ml-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
