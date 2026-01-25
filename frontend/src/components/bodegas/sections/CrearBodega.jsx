// src/components/bodegas/sections/CrearBodega.jsx
import React from 'react';
import { BuildingStorefrontIcon, StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function CrearBodega({ bodegaForm, setBodegaForm, bodegaLoading, onCrearBodega, onClose }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
          <BuildingStorefrontIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">Nueva Bodega</h3>
          <p className="text-sm text-slate-600">Configura los detalles de tu nueva bodega</p>
        </div>
      </div>

      <form onSubmit={onCrearBodega} className="space-y-6">
        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de la bodega</label>
          <input
            required
            className="w-full px-4 py-3 bg-white/70 border-2 border-slate-200/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder:text-slate-400"
            value={bodegaForm?.nombre || ''}
            onChange={(e) => setBodegaForm({ ...bodegaForm, nombre: e.target.value })}
            placeholder="Ej: Bodega Central Norte"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de bodega</label>
          <select
            className="w-full px-4 py-3 bg-white/70 border-2 border-slate-200/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
            value={bodegaForm?.tipo || 'SUC'}
            onChange={(e) => setBodegaForm({ ...bodegaForm, tipo: e.target.value })}
          >
            <option value="SUC">Sucursal (SUC)</option>
          </select>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <StarIcon className="w-5 h-5 text-amber-500" />
                Bodega Predeterminada
              </h4>
              <p className="text-sm text-slate-600 mt-1">Esta bodega se usará por defecto en todas las operaciones</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only"
                checked={bodegaForm?.es_predeterminada || false}
                onChange={(e) => setBodegaForm({ ...bodegaForm, es_predeterminada: e.target.checked })}
              />
              <div className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                bodegaForm?.es_predeterminada ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30' : 'bg-slate-300'
              }`}>
                <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transform transition-all duration-300 ${
                  bodegaForm?.es_predeterminada ? 'translate-x-6' : ''
                }`}>
                  {bodegaForm?.es_predeterminada && (<StarIcon className="w-3.5 h-3.5 text-indigo-500" />)}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-800">Estado de la bodega</h4>
              <p className="text-sm text-slate-600 mt-1">Controla si la bodega estará disponible</p>
            </div>

            <div className="flex items-center bg-white/80 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: true })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  bodegaForm?.estatus ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <CheckCircleIcon className="w-4 h-4" /> Activo
              </button>

              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: false })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  !bodegaForm?.estatus ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <XCircleIcon className="w-4 h-4" /> Inactivo
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-slate-200/60">
          <button type="button" onClick={onClose} className="px-6 py-3 text-slate-700 font-medium rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200">Cancelar</button>
          <button type="submit" disabled={bodegaLoading} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200">
            {bodegaLoading ? (<div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Creando bodega...</div>) : 'Crear bodega'}
          </button>
        </div>
      </form>
    </div>
  );
}
