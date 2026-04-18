// src/components/bodegas/sections/CrearBodega.jsx
import React from 'react';
import { BuildingStorefrontIcon, StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import '../../../styles/bodegas-responsive.css';

export default function CrearBodega({ bodegaForm, setBodegaForm, bodegaLoading, onCrearBodega, onClose }) {
  return (
    <div className="rounded-xl p-3 sm:p-4 md:p-5 border" style={{
      backgroundColor: '#0f172a',
      borderColor: '#1e293b'
    }}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-500 rounded-lg" style={{
          width: 'clamp(2.5rem, 5vw, 3rem)',
          height: 'clamp(2.5rem, 5vw, 3rem)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BuildingStorefrontIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-50 leading-tight">
            Nueva Bodega
          </h3>
          <p className="text-xs text-slate-400 truncate">
            Configura los detalles de tu nueva bodega
          </p>
        </div>
      </div>

      <form onSubmit={onCrearBodega} className="flex flex-col gap-3 sm:gap-4">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">
            Nombre de la bodega
          </label>
          <input
            required
            type="text"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 touch-target"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#f1f5f9'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.boxShadow = 'none';
            }}
            value={bodegaForm?.nombre || ''}
            onChange={(e) => setBodegaForm({ ...bodegaForm, nombre: e.target.value })}
            placeholder="Ej: Bodega Central Norte"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-1.5 sm:mb-2">
            Tipo de bodega
          </label>
          <select
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 touch-target appearance-none"
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              color: '#f1f5f9'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#60a5fa';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(96,165,250,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#334155';
              e.currentTarget.style.boxShadow = 'none';
            }}
            value={bodegaForm?.tipo || 'SUC'}
            onChange={(e) => setBodegaForm({ ...bodegaForm, tipo: e.target.value })}
          >
            <option value="SUC">Sucursal (SUC)</option>
          </select>
        </div>

        <div className="rounded-lg p-3 sm:p-4 border" style={{
          background: 'linear-gradient(to right, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
          borderColor: '#312e81'
        }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-1.5 sm:gap-2 mb-1">
                <StarIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="truncate">Bodega Predeterminada</span>
              </h4>
              <p className="text-xs text-slate-400 line-clamp-2">
                Esta bodega se usará por defecto en todas las operaciones
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={bodegaForm?.es_predeterminada || false}
                onChange={(e) => setBodegaForm({ ...bodegaForm, es_predeterminada: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-blue-500" style={{
                transition: 'all 0.3s'
              }}>
                <span className="absolute inset-0 flex items-center justify-end pr-1">
                  {bodegaForm?.es_predeterminada && <StarIcon className="w-3 h-3 text-indigo-500" />}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="rounded-lg p-3 sm:p-4 border" style={{
          background: 'linear-gradient(to right, rgba(16,185,129,0.1), rgba(20,184,166,0.1))',
          borderColor: '#065f46'
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-semibold text-slate-200 mb-1">
                Estado de la bodega
              </h4>
              <p className="text-xs text-slate-400">
                Controla si la bodega estará disponible
              </p>
            </div>

            <div className="flex items-center bg-slate-800 rounded-lg p-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: true })}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 touch-target hover:text-slate-200 hover:bg-slate-700/30"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: bodegaForm?.estatus ? '#10b981' : 'transparent',
                  color: bodegaForm?.estatus ? 'white' : '#94a3b8'
                }}
              >
                <CheckCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Activo</span>
              </button>

              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: false })}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 touch-target hover:text-slate-200 hover:bg-slate-700/30"
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: !bodegaForm?.estatus ? '#f43f5e' : 'transparent',
                  color: !bodegaForm?.estatus ? 'white' : '#94a3b8'
                }}
              >
                <XCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Inactivo</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t" style={{ borderColor: '#1e293b' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium rounded-lg border transition-all duration-200 touch-target hover:bg-slate-800"
            style={{
              borderColor: '#334155',
              color: '#cbd5e1',
              backgroundColor: 'transparent'
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={bodegaLoading}
            className="px-5 sm:px-8 py-2.5 sm:py-3 text-white text-sm font-semibold rounded-lg transition-all duration-200 touch-target disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: 'linear-gradient(to right, rgb(37,99,235), rgb(59,130,246))',
              border: 'none'
            }}
          >
            {bodegaLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" style={{
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span>Creando...</span>
              </div>
            ) : 'Crear bodega'}
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
