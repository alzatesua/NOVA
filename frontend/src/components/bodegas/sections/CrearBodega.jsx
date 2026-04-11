// src/components/bodegas/sections/CrearBodega.jsx
import React from 'react';
import { BuildingStorefrontIcon, StarIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export default function CrearBodega({ bodegaForm, setBodegaForm, bodegaLoading, onCrearBodega, onClose }) {
  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{
          padding: '8px',
          background: 'linear-gradient(to bottom right, rgb(37,99,235), rgb(59,130,246))',
          borderRadius: '8px'
        }}>
          <BuildingStorefrontIcon style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#f1f5f9', margin: 0 }}>Nueva Bodega</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0' }}>Configura los detalles de tu nueva bodega</p>
        </div>
      </div>

      <form onSubmit={onCrearBodega} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
            Nombre de la bodega
          </label>
          <input
            required
            type="text"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
              outline: 'none',
              transition: 'all 0.3s'
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
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
            Tipo de bodega
          </label>
          <select
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '14px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f1f5f9',
              outline: 'none',
              transition: 'all 0.3s'
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

        <div style={{
          background: 'linear-gradient(to right, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
          border: '1px solid #312e81',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                margin: '0 0 2px 0'
              }}>
                <StarIcon style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                Bodega Predeterminada
              </h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Esta bodega se usará por defecto en todas las operaciones</p>
            </div>

            <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                checked={bodegaForm?.es_predeterminada || false}
                onChange={(e) => setBodegaForm({ ...bodegaForm, es_predeterminada: e.target.checked })}
              />
              <div style={{
                position: 'relative',
                width: '44px',
                height: '24px',
                borderRadius: '9999px',
                transition: 'all 0.3s',
                backgroundColor: bodegaForm?.es_predeterminada
                  ? 'linear-gradient(to right, rgb(37,99,235), rgb(59,130,246))'
                  : '#475569'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '9999px',
                  backgroundColor: 'white',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: bodegaForm?.es_predeterminada ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'all 0.3s'
                }}>
                  {bodegaForm?.es_predeterminada && <StarIcon style={{ width: '12px', height: '12px', color: '#6366f1' }} />}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(to right, rgba(16,185,129,0.1), rgba(20,184,166,0.1))',
          border: '1px solid #065f46',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0', margin: '0 0 2px 0' }}>
                Estado de la bodega
              </h4>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Controla si la bodega estará disponible</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: '8px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: true })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: bodegaForm?.estatus ? '#10b981' : 'transparent',
                  color: bodegaForm?.estatus ? 'white' : '#94a3b8'
                }}
                onMouseEnter={(e) => {
                  if (!bodegaForm?.estatus) {
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!bodegaForm?.estatus) {
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <CheckCircleIcon style={{ width: '14px', height: '14px' }} />
                Activo
              </button>

              <button
                type="button"
                onClick={() => setBodegaForm({ ...bodegaForm, estatus: false })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: !bodegaForm?.estatus ? '#f43f5e' : 'transparent',
                  color: !bodegaForm?.estatus ? 'white' : '#94a3b8'
                }}
                onMouseEnter={(e) => {
                  if (bodegaForm?.estatus) {
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (bodegaForm?.estatus) {
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <XCircleIcon style={{ width: '14px', height: '14px' }} />
                Inactivo
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '8px',
              border: '1px solid #334155',
              color: '#cbd5e1',
              backgroundColor: 'transparent',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={bodegaLoading}
            style={{
              padding: '8px 20px',
              background: 'linear-gradient(to right, rgb(37,99,235), rgb(59,130,246))',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              cursor: bodegaLoading ? 'not-allowed' : 'pointer',
              opacity: bodegaLoading ? 0.6 : 1,
              transition: 'all 0.2s',
              border: 'none'
            }}
            onMouseEnter={(e) => {
              if (!bodegaLoading) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {bodegaLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creando bodega...
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
