/**
 * Vista principal de Caja — Diseño Profesional (mismo estilo que MoraView)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import CajaDashboard from './caja/CajaDashboard';
import MovimientosTable from './caja/MovimientosTable';
import RegistroMovimiento from './caja/RegistroMovimiento';
import CuadreCaja from './caja/CuadreCaja';
import ArqueoCaja from './caja/ArqueoCaja';
import HistorialArqueos from './caja/HistorialArqueos';
import CajaMenor from './caja/CajaMenor';
import { fetchSucursalesCaja } from '../services/api';
import { showToast } from '../utils/toast';

/* ─── Paleta ─────────────────────────────────────────────────────────── */
const C = {
  blue:       '#2563eb',
  blueDark:   '#1d4ed8',
  blueLight:  '#eff6ff',
  blueBorder: '#bfdbfe',
  text:       '#111827',
  textMid:    '#374151',
  textSub:    '#6b7280',
  textMuted:  '#9ca3af',
  border:     '#e5e7eb',
  surface:    '#ffffff',
  bg:         '#f9fafb',
  // Dark mode colors
  dark: {
    text:       '#f9fafb',
    textMid:    '#d1d5db',
    textSub:    '#9ca3af',
    textMuted:  '#6b7280',
    border:     '#374151',
    surface:    '#1f2937',
    bg:         '#111827',
    blueLight:  '#1e3a5f',
    blueBorder: '#1e40af',
  }
};

/* ─── Iconos SVG inline ───────────────────────────────────────────────── */
const IcoCash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);
const IcoBuilding = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
  </svg>
);
const IcoChevron = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="14" height="14" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M6 8l4 4 4-4"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
  </svg>
);
const IcoFilter = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="13" height="13" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
  </svg>
);

/* ─── Custom Dropdown Component ─────────────────────────────────────────── */
function SucursalDropdown({ value, onChange, options, disabled, loading, isDark = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selected = options.find(o => o.id === value);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          minWidth: '200px',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          border: `1px solid ${isOpen ? '#3b82f6' : (isDark ? '#374151' : '#d1d5db')}`,
          color: isDark ? '#f9fafb' : '#111827',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'all 0.2s',
          opacity: disabled || loading ? 0.5 : 1,
          userSelect: 'none'
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled && !loading) {
            e.target.style.borderColor = isDark ? '#3b82f6' : '#93c5fd';
            e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !disabled && !loading) {
            e.target.style.borderColor = isDark ? '#374151' : '#d1d5db';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: isDark ? '#94a3b8' : '#6b7280', flexShrink: 0 }}>
            <IcoBuilding />
          </span>
          <span>{selected ? selected.nombre : 'Todas las sedes'}</span>
        </div>
        <span style={{
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          color: isDark ? '#94a3b8' : '#6b7280'
        }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8l4 4 4-4"/>
          </svg>
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            minWidth: '100%',
            maxWidth: '320px',
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 100000,
            maxHeight: '400px',
            overflowY: 'auto',
            animation: 'dropdownFadeIn 0.2s ease-out',
            padding: '8px'
          }}
        >
          <style>{`
            @keyframes dropdownFadeIn {
              from {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .dropdown-option {
              padding: 12px 16px;
              borderRadius: 8px;
              cursor: pointer;
              transition: all 0.15s;
              display: flex;
              align-items: center;
              gap: 12px;
              fontSize: '14px';
              fontWeight: 500;
              margin-bottom: 4px;
            }
            .dropdown-option:hover {
              background-color: ${isDark ? '#1e3a5f' : '#eff6ff'} !important;
            }
            .dropdown-option-selected {
              background-color: #3b82f6 !important;
              color: #ffffff !important;
            }
          `}</style>

          {/* Opción: Todas las sedes */}
          <div
            onClick={() => handleSelect(null)}
            className="dropdown-option"
            style={{
              backgroundColor: value === null ? '#3b82f6' : 'transparent',
              color: value === null ? '#ffffff' : (isDark ? '#e2e8f0' : '#374151'),
            }}
          >
            <span style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: value === null ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(107, 114, 128, 0.1)'),
              color: value === null ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
              flexShrink: 0
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
            </span>
            <span style={{ flex: 1 }}>Todas las sedes</span>
            {value === null && (
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            )}
          </div>

          {/* Línea separadora */}
          {options.length > 0 && (
            <div style={{
              height: '1px',
              backgroundColor: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.8)',
              margin: '8px 0'
            }} />
          )}

          {/* Opciones de sucursales */}
          {options.map((sucursal) => (
            <div
              key={sucursal.id}
              onClick={() => handleSelect(sucursal.id)}
              className="dropdown-option"
              style={{
                backgroundColor: value === sucursal.id ? '#3b82f6' : 'transparent',
                color: value === sucursal.id ? '#ffffff' : (isDark ? '#e2e8f0' : '#374151'),
              }}
            >
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: value === sucursal.id ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(107, 114, 128, 0.1)'),
                color: value === sucursal.id ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
                flexShrink: 0
              }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </span>
              <span style={{ flex: 1 }}>{sucursal.nombre}</span>
              {value === sucursal.id && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Estilos globales mínimos (solo lo que inline no puede hacer) ────── */
const STYLES = `
  @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .caja-section { animation: fadein .25s ease both; }
  .caja-tab:hover:not(.caja-tab-active) { background: var(--caja-blue-light, #eff6ff); color: var(--caja-blue, #2563eb); }
  .dark .caja-tab:hover:not(.caja-tab-active) { background: var(--caja-blue-light, #1e3a5f); color: var(--caja-blue, #3b82f6); }
  .caja-tab-active { background: var(--caja-blue, #2563eb); color: #fff; }
  .caja-pill:focus-within { border-color: var(--caja-blue, #2563eb); box-shadow: 0 0 0 3px rgba(37,99,235,0.13); }
  .dark .caja-pill:focus-within { border-color: var(--caja-blue-dark, #2563eb); box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }

  /* Modern Select Styles */
  .modern-select {
    background: transparent !important;
    border: none !important;
    outline: none !important;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    appearance: none !important;
    -webkit-appearance: none !important;
  }
  .modern-select option {
    background: var(--caja-surface, #ffffff) !important;
    color: var(--caja-text, #111827) !important;
    padding: 10px 14px !important;
    font-weight: 500;
    font-size: 14px;
    border-bottom: 1px solid var(--caja-border, #e5e7eb);
  }
  .dark .modern-select option {
    background: var(--caja-surface, #0f172a) !important;
    color: var(--caja-text, #ffffff) !important;
    border-bottom: 1px solid var(--caja-border, #334155);
  }
  .modern-select option:hover {
    background: var(--caja-blue-light, #eff6ff) !important;
  }
  .dark .modern-select option:hover {
    background: var(--caja-blue-light, #1e3a5f) !important;
  }
  .modern-select option:checked {
    background: var(--caja-blue, #2563eb) !important;
    color: #ffffff !important;
    font-weight: 600;
  }
  .dark .modern-select option:checked {
    background: var(--caja-blue, #3b82f6) !important;
    color: #ffffff !important;
  }
  .modern-select:focus {
    outline: none !important;
  }
  .modern-select:focus ~ .select-chevron-modern {
    transform: rotate(180deg);
  }
  .select-chevron-modern:hover {
    transform: scale(1.1);
  }
  .caja-chip:hover:not(.caja-chip-active) { border-color: var(--caja-blue, #2563eb); color: var(--caja-blue, #2563eb); background: var(--caja-blue-light, #eff6ff); }
  .caja-chip-active { background: var(--caja-blue, #2563eb); border-color: var(--caja-blue, #2563eb); color: #fff; }
  .caja-btn-ghost:hover { background: var(--caja-blue-light, #eff6ff); border-color: var(--caja-blue, #2563eb); color: var(--caja-blue, #2563eb); }
  .caja-pill input[type="date"], .caja-pill select { background: transparent !important; border: none !important; outline: none !important; font-family: inherit; font-size: 13px; font-weight: 600; color: var(--caja-text, #111827) !important; cursor: pointer; padding: 0; appearance: none !important; -webkit-appearance: none !important; }
  .caja-pill select { padding-right: 20px !important; position: relative; z-index: 1; }
  .caja-pill select option { background: var(--caja-surface, #ffffff) !important; color: var(--caja-text, #111827) !important; padding: 10px 14px !important; font-weight: 500; font-size: 14px; border-bottom: 1px solid var(--caja-border, #e5e7eb); transition: background-color 0.15s ease; }
  .dark .caja-pill select option { background: var(--caja-surface, #0f172a) !important; color: var(--caja-text, #ffffff) !important; border-bottom: 1px solid var(--caja-border, #334155); }
  .caja-pill select option:hover { background: var(--caja-blue-light, #eff6ff) !important; }
  .dark .caja-pill select option:hover { background: var(--caja-blue-light, #1e3a5f) !important; }
  .caja-pill select option:checked { background: var(--caja-blue, #2563eb) !important; color: #ffffff !important; font-weight: 600; }
  .dark .caja-pill select option:checked { background: var(--caja-blue, #3b82f6) !important; color: #ffffff !important; }
  .caja-pill select:focus { outline: none !important; }
  .caja-pill .select-chevron { position: relative; z-index: 0; margin-left: -18px !important; pointer-events: none; flex-shrink: 0; transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); color: #6b7280 !important; }
  .dark .caja-pill .select-chevron { color: #94a3b8 !important; }
  .caja-pill select:focus ~ .select-chevron { transform: rotate(180deg); }

  /* Custom scrollbar for dropdown in WebKit browsers */
  .caja-pill select::-webkit-scrollbar { width: 8px; }
  .caja-pill select::-webkit-scrollbar-track { background: var(--caja-bg, #f9fafb); border-radius: 4px; }
  .caja-pill select::-webkit-scrollbar-thumb { background: var(--caja-border, #e5e7eb); border-radius: 4px; }
  .caja-pill select::-webkit-scrollbar-thumb:hover { background: var(--caja-text-muted, #9ca3af); }
  .dark .caja-pill select::-webkit-scrollbar-track { background: var(--caja-bg, #020617); }
  .dark .caja-pill select::-webkit-scrollbar-thumb { background: var(--caja-border, #334155); }
  .dark .caja-pill select::-webkit-scrollbar-thumb:hover { background: var(--caja-text-muted, #6b7280); }

  /* Ring effect IGUAL QUE PROVEEDORESVIEW */
  .caja-panel {
    position: relative;
  }
  .caja-panel::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(to bottom, rgba(226, 232, 240, 0.5), rgba(226, 232, 240, 0.2));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
  .dark .caja-panel::before {
    background: linear-gradient(to bottom, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1));
  }
  .dark .caja-header::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(to bottom, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.05));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  }

  /* ─── Responsive Design con Breakpoints Específicos ─────────────────── */

  /* ─── 3xl / 4K (1920px+) ───────────────────────────────────────────── */
  @media (min-width: 1920px) {
    .caja-grid-desktop {
      grid-template-columns: minmax(0, 1fr) minmax(0, 2.2fr) !important;
      gap: 24px !important;
    }
    .caja-header {
      padding: 16px 32px !important;
    }
    .caja-content {
      padding: 24px 32px !important;
    }
  }

  /* ─── xl / desktop (1280px - 1535px) ────────────────────────────────── */
  @media (min-width: 1280px) and (max-width: 1535px) {
    .caja-grid-desktop {
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) !important;
      gap: 20px !important;
    }
  }

  /* ─── lg / laptop (1024px - 1279px) ─────────────────────────────────── */
  @media (min-width: 1024px) and (max-width: 1279px) {
    .caja-grid-desktop {
      grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) !important;
      gap: 18px !important;
    }
    .caja-header {
      padding: 13px 24px !important;
    }
    .caja-content {
      padding: 18px 24px !important;
    }
  }

  /* ─── md / tablet (768px - 1023px) ──────────────────────────────────── */
  @media (min-width: 768px) and (max-width: 1023px) {
    .caja-grid-desktop {
      display: flex !important;
      flex-direction: column !important;
      gap: 16px !important;
    }
    .caja-header {
      padding: 12px 20px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    .caja-controls {
      width: 100% !important;
      justify-content: flex-start !important;
      flex-wrap: wrap !important;
    }
    .caja-tab-bar {
      width: 100% !important;
      overflow-x: auto !important;
      justify-content: flex-start !important;
    }
    .caja-tab {
      flex: 0 0 auto !important;
      min-width: max-content !important;
    }
    .caja-content {
      padding: 16px 20px !important;
    }
    .caja-pill {
      min-width: 140px !important;
    }
  }

  /* ─── sm / mobile-lg landscape (481px - 767px) ──────────────────────── */
  @media (min-width: 481px) and (max-width: 767px) {
    .caja-grid-desktop {
      display: flex !important;
      flex-direction: column !important;
      gap: 14px !important;
    }
    .caja-header {
      padding: 12px 16px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 12px !important;
    }
    .caja-iconBox {
      width: 34px !important;
      height: 34px !important;
    }
    .caja-title {
      font-size: 15px !important;
    }
    .caja-sub {
      font-size: 11px !important;
    }
    .caja-controls {
      width: 100% !important;
      justify-content: flex-start !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 8px !important;
    }
    .caja-pill {
      width: 100% !important;
      justify-content: center !important;
      min-width: auto !important;
    }
    .modern-select-input {
      width: 100% !important;
      min-width: auto !important;
    }
    .caja-tab-bar {
      width: 100% !important;
      overflow-x: auto !important;
      justify-content: flex-start !important;
      padding: 3px !important;
    }
    .caja-tab {
      flex: 1 1 auto !important;
      min-width: 100px !important;
      font-size: 11px !important;
      padding: 6px 10px !important;
    }
    .caja-content {
      padding: 14px 16px !important;
      gap: 16px !important;
    }
    .caja-panel {
      border-radius: 10px !important;
    }
    .caja-panelHead {
      padding: 11px 14px !important;
      font-size: 12px !important;
    }
    .caja-panelTitle {
      font-size: 12px !important;
    }
    .caja-filterBar {
      padding: 10px 14px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 8px !important;
    }
    .caja-chip {
      font-size: 11px !important;
      padding: 4px 10px !important;
    }
  }

  /* ─── xs / mobile portrait (≤ 480px) ───────────────────────────────── */
  @media (max-width: 480px) {
    .caja-grid-desktop {
      display: flex !important;
      flex-direction: column !important;
      gap: 12px !important;
    }
    .caja-header {
      padding: 10px 12px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 10px !important;
    }
    .caja-iconBox {
      width: 32px !important;
      height: 32px !important;
    }
    .caja-title {
      font-size: 14px !important;
      line-height: 1.3 !important;
    }
    .caja-sub {
      font-size: 10px !important;
      line-height: 1.4 !important;
    }
    .caja-controls {
      width: 100% !important;
      justify-content: flex-start !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 7px !important;
    }
    .caja-pill {
      width: 100% !important;
      justify-content: center !important;
      padding: 7px 10px !important;
      font-size: 12px !important;
      min-width: auto !important;
    }
    .modern-select-input {
      width: 100% !important;
      min-width: auto !important;
      padding: 8px 32px 8px 10px !important;
      font-size: 12px !important;
    }
    .caja-tab-bar {
      width: 100% !important;
      overflow-x: auto !important;
      justify-content: flex-start !important;
      padding: 2px !important;
      gap: 1px !important;
    }
    .caja-tab {
      flex: 1 1 auto !important;
      min-width: 80px !important;
      font-size: 10px !important;
      padding: 5px 8px !important;
      gap: 4px !important;
    }
    .caja-content {
      padding: 12px 12px !important;
      gap: 14px !important;
    }
    .caja-panel {
      border-radius: 10px !important;
    }
    .caja-panelHead {
      padding: 10px 12px !important;
      font-size: 11px !important;
    }
    .caja-panelTitle {
      font-size: 11px !important;
    }
    .caja-filterBar {
      padding: 8px 12px !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 7px !important;
    }
    .caja-filterLabel {
      font-size: 9px !important;
    }
    .caja-chip {
      font-size: 10px !important;
      padding: 4px 10px !important;
    }
    .caja-btnGhost {
      font-size: 10px !important;
      padding: 5px 8px !important;
    }
  }

  /* ─── Very small mobile (≤ 380px) ──────────────────────────────────── */
  @media (max-width: 380px) {
    .caja-header {
      padding: 8px 10px !important;
    }
    .caja-iconBox {
      width: 28px !important;
      height: 28px !important;
    }
    .caja-title {
      font-size: 13px !important;
    }
    .caja-sub {
      font-size: 9px !important;
    }
    .caja-content {
      padding: 10px 10px !important;
      gap: 12px !important;
    }
    .caja-pill {
      padding: 6px 8px !important;
      font-size: 11px !important;
    }
    .caja-tab {
      font-size: 9px !important;
      padding: 4px 6px !important;
      min-width: 70px !important;
    }
    .caja-panelHead {
      padding: 8px 10px !important;
    }
    .caja-filterBar {
      padding: 7px 10px !important;
    }
  }

  /* ─── Extra small mobile (≤ 340px) ──────────────────────────────────── */
  @media (max-width: 340px) {
    .caja-tab {
      min-width: 60px !important;
      font-size: 8px !important;
      padding: 4px 5px !important;
    }
    .caja-title {
      font-size: 12px !important;
    }
  }

  /* Dark mode support - IGUALES QUE PROVEEDORESVIEW */
  @media (prefers-color-scheme: dark) {
    :root {
      --caja-blue: #3b82f6;
      --caja-blue-dark: #2563eb;
      --caja-blue-light: #1e3a5f;
      --caja-blue-border: #1e40af;
      --caja-text: #ffffff;
      --caja-text-mid: #e2e8f0;
      --caja-text-sub: #cbd5e1;
      --caja-text-muted: #94a3b8;
      --caja-border: #334155;
      --caja-surface: #0f172a;
      --caja-bg: #020617;
    }
  }

  @media (prefers-color-scheme: light) {
    :root {
      --caja-blue: #2563eb;
      --caja-blue-dark: #1d4ed8;
      --caja-blue-light: #eff6ff;
      --caja-blue-border: #bfdbfe;
      --caja-text: #111827;
      --caja-text-mid: #374151;
      --caja-text-sub: #6b7280;
      --caja-text-muted: #9ca3af;
      --caja-border: #e5e7eb;
      --caja-surface: #ffffff;
      --caja-bg: #f9fafb;
    }
  }

  /* Support for manual dark mode class - IGUALES QUE PROVEEDORESVIEW */
  .dark {
    --caja-blue: #3b82f6;
    --caja-blue-dark: #2563eb;
    --caja-blue-light: #1e3a5f;
    --caja-blue-border: #1e40af;
    --caja-text: #ffffff;
    --caja-text-mid: #e2e8f0;
    --caja-text-sub: #cbd5e1;
    --caja-text-muted: #94a3b8;
    --caja-border: #334155;
    --caja-surface: #0f172a;
    --caja-bg: #020617;
  }
`;

export default function CajaView() {
  const { isAdmin, idSucursal, usuario, tokenUsuario, subdominio } = useAuth();


  const [fecha,                setFecha]                = useState(new Date().toISOString().split('T')[0]);
  const [filtroTipo,           setFiltroTipo]           = useState('todos');
  const [vista,                setVista]                = useState('general');
  const [refreshKey,           setRefreshKey]           = useState(0);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
  const [sucursales,           setSucursales]           = useState([]);
  const [loadingSucursales,    setLoadingSucursales]    = useState(false);
  const [isDark,               setIsDark]               = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDark = () => {
      const isDarkMode = document.documentElement.classList.contains('dark') ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(isDarkMode);
    };

    checkDark();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDark);

    // Observer for class changes on html element
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mediaQuery.removeEventListener('change', checkDark);
      observer.disconnect();
    };
  }, []);

  useEffect(() => { cargarSucursales(); }, [isAdmin, idSucursal]);

  const cargarSucursales = async () => {
    setLoadingSucursales(true);
    try {
      const response = await fetchSucursalesCaja({ token: tokenUsuario, usuario, subdominio });
      if (response?.success) {
        setSucursales(response.data);
        if (!isAdmin && response.sucursal_asignada) setSucursalSeleccionada(response.sucursal_asignada);
      } else { showToast('Error al cargar las sucursales', 'error'); }
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED' || err.isAuthError) {
        showToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'error');
      } else {
        showToast('Error al cargar las sucursales', 'error');
      }
    } finally { setLoadingSucursales(false); }
  };

  // Para usuarios no-admin, siempre usar su sucursal asignada
  // Para admin, usar la sucursal seleccionada o null para ver todas
  const getSucursalFilter     = () => {
    if (isAdmin) {
      return sucursalSeleccionada || null; // Admin puede ver todas o filtrar
    }
    return idSucursal; // No-admin solo ve su sucursal
  };
  const handleRegistroExitoso = () => setRefreshKey(k => k + 1);
  const handleRefresh         = () => setRefreshKey(k => k + 1);

  // Dynamic colors based on theme - IGUALES QUE PROVEEDORESVIEW
  const colors = isDark ? {
    blue:       '#3b82f6',
    blueDark:   '#2563eb',
    blueLight:  '#1e3a5f',
    blueBorder: '#1e40af',
    text:       '#ffffff',
    textMid:    '#e2e8f0',
    textSub:    '#cbd5e1',
    textMuted:  '#94a3b8',
    border:     '#334155',
    surface:    '#0f172a',
    bg:         '#020617',
  } : {
    blue:       '#2563eb',
    blueDark:   '#1d4ed8',
    blueLight:  '#eff6ff',
    blueBorder: '#bfdbfe',
    text:       '#111827',
    textMid:    '#374151',
    textSub:    '#6b7280',
    textMuted:  '#9ca3af',
    border:     '#e5e7eb',
    surface:    '#ffffff',
    bg:         '#f9fafb',
  };

  const vistaOptions  = [
    { value: 'general',         label: 'Vista General'     },
    { value: 'movimientos',     label: 'Movimientos'       },
    { value: 'cuadre',          label: 'Cuadre de Caja'    },
    { value: 'arqueo',          label: 'Arqueo de Caja'    },
    { value: 'historial_arqueos', label: 'Historial Arqueos' },
    { value: 'caja_menor',      label: 'Caja Menor'        },
  ];
  const filtroOptions = [
    { value: 'todos',   label: 'Todos'    },
    { value: 'entrada', label: 'Entradas' },
    { value: 'salida',  label: 'Salidas'  },
  ];

  /* ── Shared inline styles ── */
  const s = {
    page:    {
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden',
      boxSizing: 'border-box'
    },

    // Header - responsive padding
    header:  {
      padding: 'clamp(12px, 2vw, 14px) clamp(16px, 3vw, 28px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
      position: 'relative',
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    title:   { fontSize: 'clamp(16px, 2vw, 17px)', fontWeight: 700, margin: 0 },
    sub:     { fontSize: 'clamp(11px, 1.5vw, 12px)', margin: '2px 0 0' },

    // Controls - responsive gap and flex
    controls:{
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(6px, 1vw, 8px)',
      flexWrap: 'wrap',
      flex: '1 1 auto',
      justifyContent: 'flex-end'
    },

    // Pill (date / select inputs) - responsive
    pill:    {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: 'clamp(6px, 1vw, 7px) clamp(10px, 2vw, 12px)',
      borderRadius: 8,
      fontSize: 'clamp(12px, 1.5vw, 13px)',
      fontWeight: 600,
      transition: 'border-color .15s, box-shadow .15s',
      whiteSpace: 'nowrap',
      cursor: 'default',
    },

    // Tab bar - responsive
    tabBar:  {
      display: 'flex',
      gap: 2,
      borderRadius: 8,
      padding: 3,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    tab:     (on) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: 'clamp(6px, 1vw, 7px) clamp(10px, 2vw, 14px)',
      borderRadius: 6,
      border: 'none',
      cursor: 'pointer',
      fontSize: 'clamp(11px, 1.5vw, 13px)',
      fontWeight: 600,
      transition: 'all .15s',
      boxShadow: on ? '0 1px 3px rgba(37,99,235,.2)' : 'none',
      fontFamily: 'inherit',
      flex: '1 1 auto',
      textAlign: 'center',
      justifyContent: 'center',
      minWidth: 'min-content'
    }),

    // Content - responsive padding
    content: {
      flex: 1,
      padding: 'clamp(12px, 2vw, 20px) clamp(16px, 3vw, 28px)',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      maxWidth: '100%',
      overflow: 'hidden'
    },

    // Cards - IGUALES QUE PROVEEDORESVIEW: ring-1 ring-slate-200 dark:!ring-slate-700
    panel:   {
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
      boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,.04)',
      boxSizing: 'border-box',
      position: 'relative',
    },
    panelBefore: {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 12,
      padding: '1px',
      background: isDark ? 'linear-gradient(to bottom, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.1))' : 'linear-gradient(to bottom, rgba(226, 232, 240, 0.5), rgba(226, 232, 240, 0.2))',
      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'xor',
      maskComposite: 'exclude',
      pointerEvents: 'none',
    },
    panelHead: {
      padding: 'clamp(10px, 2vw, 13px) clamp(14px, 3vw, 18px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8
    },
    panelTitle:{
      fontSize: 'clamp(13px, 1.5vw, 14px)',
      fontWeight: 600,
      margin: 0
    },

    // Grid (registro + movimientos) - responsive columns
    grid:    {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: 'clamp(12px, 2vw, 20px)'
    },

    // Grid for desktop only
    gridDesktop: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)',
      gap: 'clamp(12px, 2vw, 20px)'
    },

    // Filter bar - responsive
    filterBar: {
      padding: 'clamp(10px, 2vw, 12px) clamp(14px, 3vw, 18px)',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(6px, 1vw, 10px)',
      flexWrap: 'wrap'
    },
    filterLabel: {
      fontSize: 'clamp(10px, 1.2vw, 11px)',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      display: 'flex',
      alignItems: 'center',
      gap: 5
    },

    // Chips - responsive
    chip:    (on) => ({
      padding: 'clamp(4px, 1vw, 5px) clamp(10px, 2vw, 14px)',
      borderRadius: 999,
      fontSize: 'clamp(11px, 1.3vw, 12px)',
      fontWeight: 600,
      border: `1px solid ${on ? colors.blue : colors.border}`,
      background: on ? colors.blue : colors.surface,
      color: on ? '#fff' : colors.textSub,
      cursor: 'pointer',
      transition: 'all .15s',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap'
    }),

    // Ghost btn - responsive
    btnGhost: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: 'clamp(5px, 1vw, 6px) clamp(10px, 2vw, 12px)',
      background: 'transparent',
      borderRadius: 7,
      fontSize: 'clamp(11px, 1.3vw, 12px)',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all .15s',
      fontFamily: 'inherit'
    },
  };

  return (
    <>
      <style>{STYLES}</style>
      <div style={s.page} className="dark:!bg-slate-950">

        {/* ── HEADER ── */}
        <header style={s.header} className="caja-header bg-white dark:!bg-slate-900 border-b border-gray-200 dark:!border-slate-700">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto' }}>
            <div style={s.iconBox} className="caja-iconBox bg-blue-50 dark:!bg-blue-900/30 border border-blue-200 dark:!border-blue-700 text-blue-600 dark:!text-blue-400"><IcoCash /></div>
            <div>
              <h1 style={s.title} className="caja-title text-gray-900 dark:!text-white">Control de Caja</h1>
              <p style={s.sub} className="caja-sub text-gray-600 dark:!text-slate-400">
                {isAdmin ? 'Gestiona todos los movimientos y cuadres de caja' : 'Vista limitada a tu sucursal asignada'}
              </p>
            </div>
          </div>

          <div style={s.controls} className="caja-controls">
            {/* Fecha */}
            <label className="caja-pill ring-1 ring-slate-200 dark:!ring-slate-700 bg-white dark:!bg-slate-800" style={s.pill}>
              <IcoCalendar />
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="text-gray-900 dark:!text-white" />
            </label>

            {/* Sucursal (solo admin) */}
            {isAdmin && (
              <div className="modern-select-container" style={{ position: 'relative' }}>
                <select
                  value={sucursalSeleccionada || ''}
                  onChange={(e) => setSucursalSeleccionada(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={loadingSucursales}
                  className="modern-select-input"
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    padding: '10px 36px 10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    color: isDark ? '#f9fafb' : '#111827',
                    fontSize: '13px',
                    fontWeight: 600,
                    minWidth: '200px',
                    cursor: loadingSucursales ? 'not-allowed' : 'pointer',
                    opacity: loadingSucursales ? 0.5 : 1,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 20 20' fill='none' stroke='${encodeURIComponent(isDark ? '%2394a3b8' : '%236b7280')}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = isDark ? '#3b82f6' : '#93c5fd';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = isDark ? '#374151' : '#d1d5db';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Todas las sedes</option>
                  {sucursales.map(s => (
                    <option
                      key={s.id}
                      value={s.id}
                      style={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        color: isDark ? '#f9fafb' : '#111827',
                        padding: '12px 16px',
                        fontWeight: 500
                      }}
                    >
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tab switcher */}
            <div style={s.tabBar} className="caja-tab-bar bg-gray-50 dark:!bg-slate-800 border border-gray-200 dark:!border-slate-700">
              {vistaOptions.map(o => (
                <button
                  key={o.value}
                  className={`caja-tab${vista === o.value ? ' caja-tab-active' : ''} text-gray-600 dark:!text-slate-300`}
                  style={s.tab(vista === o.value)}
                  onClick={() => setVista(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div style={s.content} className="caja-content bg-gray-50 dark:!bg-slate-950">

          {/* Vista General */}
          {vista === 'general' && (
            <div className="caja-section" key={`general-${refreshKey}`}>
              <CajaDashboard
                fecha={fecha}
                isAdmin={isAdmin}
                idSucursal={getSucursalFilter()}
                onRefresh={handleRefresh}
                isDark={isDark}
              />
              <div style={{ ...s.gridDesktop, marginTop: 20 }} className="caja-grid-desktop">
                {/* Registro */}
                <div style={s.panel} className="caja-panel bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
                  <div style={s.panelHead} className="caja-panelHead border-b border-gray-200 dark:!border-slate-700">
                    <p style={s.panelTitle} className="caja-panelTitle dark:!text-white">Registrar Movimiento</p>
                  </div>
                  <div style={{ padding: 'clamp(12px, 2vw, 18px)' }}>
                    <RegistroMovimiento
                      idSucursal={getSucursalFilter()}
                      onRegistroExitoso={handleRegistroExitoso}
                      isDark={isDark}
                    />
                  </div>
                </div>

                {/* Movimientos */}
                <div style={s.panel} className="caja-panel bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
                  <div style={s.panelHead} className="caja-panelHead border-b border-gray-200 dark:!border-slate-700">
                    <button className="caja-btn-ghost text-gray-700 dark:!text-slate-300 border border-gray-300 dark:!border-slate-600 hover:bg-blue-50 dark:hover:!bg-slate-800 hover:border-blue-500 dark:hover:!border-slate-500 hover:text-blue-600 dark:hover:!text-white" style={s.btnGhost} onClick={handleRefresh}>
                      <IcoRefresh /> Actualizar
                    </button>
                  </div>
                  <MovimientosTable
                    fecha={fecha}
                    filtroTipo={filtroTipo}
                    isAdmin={isAdmin}
                    idSucursal={getSucursalFilter()}
                    onRefresh={handleRefresh}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Movimientos */}
          {vista === 'movimientos' && (
            <div className="caja-section" key={`movimientos-${refreshKey}`}>
              <div style={s.panel} className="bg-white dark:!bg-slate-900 ring-1 ring-slate-200 dark:!ring-slate-700">
                <div style={s.filterBar} className="caja-filterBar border-b border-gray-200 dark:!border-slate-700">
                  <span style={s.filterLabel} className="caja-filterLabel text-gray-500 dark:!text-slate-400"><IcoFilter /> Filtrar</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {filtroOptions.map(o => (
                      <button
                        key={o.value}
                        className={`caja-chip${filtroTipo === o.value ? ' caja-chip-active' : ''} dark:!text-slate-300`}
                        style={s.chip(filtroTipo === o.value)}
                        onClick={() => setFiltroTipo(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <button className="caja-btn-ghost text-gray-700 dark:!text-slate-300 border border-gray-300 dark:!border-slate-600 hover:bg-blue-50 dark:hover:!bg-slate-800 hover:border-blue-500 dark:hover:!border-slate-500 hover:text-blue-600 dark:hover:!text-white" style={{ ...s.btnGhost, marginLeft: 'auto' }} onClick={handleRefresh}>
                    <IcoRefresh /> Actualizar
                  </button>
                </div>
                <MovimientosTable
                  fecha={fecha}
                  filtroTipo={filtroTipo}
                  isAdmin={isAdmin}
                  idSucursal={getSucursalFilter()}
                  onRefresh={handleRefresh}
                />
              </div>
            </div>
          )}

          {/* Cuadre de Caja */}
          {vista === 'cuadre' && (
            <div className="caja-section" key={`cuadre-${refreshKey}`}>
              <CuadreCaja
                fecha={fecha}
                isAdmin={isAdmin}
                idSucursal={getSucursalFilter()}
              />
            </div>
          )}

          {/* Arqueo de Caja */}
          {vista === 'arqueo' && (
            <div className="caja-section" key={`arqueo-${refreshKey}`}>
              <ArqueoCaja
                fecha={fecha}
                isAdmin={isAdmin}
                idSucursal={getSucursalFilter()}
              />
            </div>
          )}

          {/* Historial de Arqueos */}
          {vista === 'historial_arqueos' && (
            <div className="caja-section" key={`historial_arqueos-${refreshKey}`}>
              <HistorialArqueos
                idSucursal={getSucursalFilter()}
              />
            </div>
          )}

          {/* Caja Menor */}
          {vista === 'caja_menor' && (
            <div className="caja-section" key={`caja_menor-${refreshKey}`}>
              <CajaMenor
                fecha={fecha}
                idSucursal={getSucursalFilter()}
                onRefresh={handleRefresh}
                isDark={isDark}
              />
            </div>
          )}

        </div>
      </div>
    </>
  );
}