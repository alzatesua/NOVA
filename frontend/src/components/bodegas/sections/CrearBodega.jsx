// src/components/bodegas/sections/CrearBodega.jsx
import React from 'react';
import { BuildingStorefrontIcon, StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function CrearBodega({ bodegaForm, setBodegaForm, bodegaLoading, onCrearBodega, onClose }) {
  return (
    <div className="bg-white/80 dark:!bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 border border-white/20 dark:!border-slate-800 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg">
          <BuildingStorefrontIcon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:!text-slate-100">Nueva Bodega</h3>
          <p className="text-xs text-slate-600 dark:!text-slate-400">Configura los detalles de tu nueva bodega</p>
        </div>
      </div>

      <form onSubmit={onCrearBodega} className="space-y-4">
        <div className="group">
          <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1.5">Nombre de la bodega</label>
          <input
            required
            className="w-full px-3 py-2 bg-white/70 dark:!bg-slate-800/70 border border-slate-200/60 dark:!border-slate-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm"
            value={bodegaForm?.nombre || ''}
            onChange={(e) => setBodegaForm({ ...bodegaForm, nombre: e.target.value })}
            placeholder="Ej: Bodega Central Norte"
          />
        </div>

        <div className="group">
          <label className="block text-xs font-semibold text-slate-700 dark:!text-slate-300 mb-1.5">Tipo de bodega</label>
          <select
            className="w-full px-3 py-2 bg-white/70 dark:!bg-slate-800/70 border border-slate-200/60 dark:!border-slate-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 text-sm"
            value={bodegaForm?.tipo || 'SUC'}
            onChange={(e) => setBodegaForm({ ...bodegaForm, tipo: e.target.value })}
          >
            <option value="SUC">Sucursal (SUC)</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg p-4 border border-indigo-100 dark:border-indigo-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:!text-slate-200 flex items-center gap-1.5">
                <StarIcon className="w-4 h-4 text-amber-500" />
                Bodega Predeterminada
              </h4>
              <p className="text-xs text-slate-600 dark:!text-slate-400 mt-0.5">Esta bodega se usará por defecto en todas las operaciones</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={bodegaForm?.es_predeterminada || false}
                onChange={(e) => setBodegaForm({ ...bodegaForm, es_predeterminada: e.target.checked })}
              />
              <div className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                bodegaForm?.es_predeterminada ? 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-md shadow-indigo-500/30' : 'bg-slate-300'
              }`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center transform transition-all duration-300 ${
                  bodegaForm?.es_predeterminada ? 'translate-x-5' : ''
                }`}>
                  {bodegaForm?.es_predeterminada && (<StarIcon className="w-3 h-3 text-indigo-500" />)}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-lg p-4 border border-emerald-100 dark:border-emerald-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:!text-slate-200">Estado de la bodega</h4>
              <p className="text-xs text-slate-600 dark:!text-slate-400 mt-0.5">Controla si la bodega estará disponible</p>
            </div>

            <div className="flex items-center bg-white/80 dark:!bg-slate-800/80 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: true })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  bodegaForm?.estatus ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' : 'text-slate-600 dark:!text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <CheckCircleIcon className="w-3.5 h-3.5" /> Activo
              </button>

              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: false })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  !bodegaForm?.estatus ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30' : 'text-slate-600 dark:!text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <XCircleIcon className="w-3.5 h-3.5" /> Inactivo
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:!border-slate-700/60">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 dark:!text-slate-300 font-medium rounded-lg border border-slate-200 dark:!border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 text-sm">Cancelar</button>
          <button type="submit" disabled={bodegaLoading} className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-lg shadow-md shadow-purple-500/30 hover:shadow-lg hover:shadow-purple-500/40 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200 text-sm">
            {bodegaLoading ? (<div className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Creando bodega...</div>) : 'Crear bodega'}
          </button>
        </div>
      </form>
    </div>
  );
}
