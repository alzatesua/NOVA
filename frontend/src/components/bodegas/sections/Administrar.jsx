// src/components/bodegas/sections/Administrar.jsx
import React from 'react';
import { BuildingStorefrontIcon, SparklesIcon, ArrowPathRoundedSquareIcon, AdjustmentsHorizontalIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export default function Administrar({ sucursalSel, handleTabChange }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Centro de Administración</h3>
          <p className="text-sm text-slate-600">Gestiona todas las operaciones de {sucursalSel?.nombre}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Crear Nueva Bodega", description: "Configura espacios de almacenamiento adicionales", icon: BuildingStorefrontIcon, color: "from-purple-500 to-pink-500", action: () => handleTabChange('crear-bodega') },
          { title: "Ajustar Inventarios", description: "Modifica existencias y corrige discrepancias", icon: SparklesIcon, color: "from-emerald-500 to-teal-500", action: () => handleTabChange('ajustar-existencia') },
          { title: "Gestionar Traslados", description: "Coordina movimientos entre bodegas", icon: ArrowPathRoundedSquareIcon, color: "from-orange-500 to-red-500", action: () => handleTabChange('realizar-traslado') },
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <button key={index} onClick={card.action} className="group text-left p-6 bg-white/60 hover:bg-white/80 rounded-2xl border border-slate-200/60 hover:border-slate-300/60 transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold text-slate-800 mb-2">{card.title}</h4>
              <p className="text-sm text-slate-600">{card.description}</p>
              <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium group-hover:gap-2 transition-all duration-300">
                Acceder <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:ml-0" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
