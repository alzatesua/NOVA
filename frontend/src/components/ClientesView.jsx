// src/components/ClientesView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  MagnifyingGlassIcon,
  GiftIcon,
  UserIcon,
  TicketIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  TagIcon,
  ArrowPathIcon,
  PencilIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { crearCliente, editarCliente, fetchCiudades } from '../services/api';
import { showToast } from '../utils/toast';
import Select from 'react-select';

// ─────────────────────────────────────────────
// Componentes reutilizables de UI
// ─────────────────────────────────────────────

function Modal({ isOpen, onClose, title, subtitle, icon: Icon, iconColor = 'from-[rgb(37,99,235)] to-[rgb(29,78,216)]', children, footer }) {
  if (!isOpen) return null;

  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      style={{ zIndex: 9998 }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff !important',
          zIndex: 9999
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b flex items-center justify-between flex-shrink-0"
          style={{
            backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff !important',
            borderColor: isDarkMode ? '#333333 !important' : '#e2e8f0 !important'
          }}
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-gradient-to-br ${iconColor} rounded-lg`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold" style={{ color: isDarkMode ? '#f5f5f5 !important' : '#0f172a' }}>{title}</h4>
              {subtitle && <p className="text-sm" style={{ color: isDarkMode ? '#cccccc !important' : '#64748b' }}>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'transparent !important' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#333333' : '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <XMarkIcon className="h-5 w-5" style={{ color: isDarkMode ? '#f5f5f5' : '#94a3b8' }} />
          </button>
        </div>

        {/* Body */}
        <div
          className="p-6 overflow-y-auto flex-1"
          style={{
            backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff !important'
          }}
        >
          <div style={{ backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff !important' }}>
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div
            className="p-6 border-t flex-shrink-0"
            style={{
              backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff !important',
              borderColor: isDarkMode ? '#333333 !important' : '#e2e8f0 !important'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }) {
  const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 shadow-sm ring-1 ring-slate-200 dark:!ring-slate-700 bg-white dark:!bg-slate-900 transition-all hover:shadow-md"
      style={{
        backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff',
        borderColor: isDarkMode ? '#333333' : '#e2e8f0'
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-sm font-medium text-slate-600 dark:!text-slate-300"
            style={{ color: isDarkMode ? '#e2e8f0 !important' : '#64748b' }}
          >
            {title}
          </p>
          <p
            className="text-2xl font-bold mt-1 text-slate-900 dark:!text-white"
            style={{ color: isDarkMode ? '#ffffff !important' : '#0f172a' }}
          >
            {value}
          </p>
        </div>
        <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');

  return (
    <div className="text-center py-14">
      <div
        className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
        style={{ backgroundColor: isDarkMode ? '#2a2a2a' : '#f1f5f9' }}
      >
        <Icon className="h-8 w-8" style={{ color: isDarkMode ? '#cccccc' : '#94a3b8' }} />
      </div>
      <p className="font-medium" style={{ color: isDarkMode ? '#f5f5f5' : '#475569' }}>{title}</p>
      {subtitle && <p className="text-sm mt-1" style={{ color: isDarkMode ? '#cccccc' : '#94a3b8' }}>{subtitle}</p>}
    </div>
  );
}

function LoadingSpinner({ color = 'blue', text = 'Cargando...' }) {
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');

  const colorMap = {
    blue: '#3b82f6',
    purple: '#8b5cf6',
    green: '#22c55e',
    red: '#ef4444'
  };

  return (
    <div className="text-center py-12">
      <div
        className="inline-block animate-spin rounded-full h-9 w-9 border-4 border-t-transparent"
        style={{ borderColor: colorMap[color] || colorMap.blue, borderTopColor: 'transparent' }}
      ></div>
      <p className="mt-3 font-medium" style={{ color: isDarkMode ? '#cccccc' : '#64748b' }}>{text}</p>
    </div>
  );
}

/** Tabla de Asignaciones con modo oscuro forzado */
function AsignacionesTable({ loading, clienteCupones, onRefresh, onUsarCupon }) {
  if (loading) {
    return <LoadingSpinner color="blue" text="Cargando asignaciones..." />;
  }

  if (clienteCupones.length === 0) {
    return (
      <div className="bg-white dark:!bg-slate-900 rounded-2xl shadow-sm p-8">
        <EmptyState icon={TicketIcon} title="No hay cupones asignados" subtitle="Comienza asignando cupones a tus clientes" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:!bg-slate-900 rounded-2xl shadow-sm overflow-hidden ring-1 ring-slate-200 dark:!ring-slate-700">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-200 dark:!border-slate-700 bg-white dark:!bg-slate-900">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-lg">
            <GiftIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-slate-900 dark:!text-white">Cupones Asignados</h4>
            <p className="text-sm text-slate-600 dark:!text-slate-300">Gestiona las asignaciones activas</p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-[rgb(37,99,235)] hover:bg-[rgb(29,78,216)] text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
        >
          <ArrowPathIcon className="h-4 w-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:!bg-slate-900">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:!bg-slate-800">
            <tr>
              <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:!text-white">Cliente</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:!text-white">Cupón</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:!text-white">Disponibles</th>
              <th className="px-6 py-4 text-left font-semibold text-slate-700 dark:!text-white">Estado</th>
              <th className="px-6 py-4 text-right font-semibold text-slate-700 dark:!text-white">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:!bg-slate-900 divide-y divide-slate-100 dark:!divide-slate-700">
            {clienteCupones.map((cc) => (
              <tr
                key={cc.id}
                className="transition-colors hover:bg-slate-50 dark:hover:!bg-slate-800"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-medium text-slate-900 dark:!text-white">
                      {cc.cliente_tienda_email || 'N/A'}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <TagIcon className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-slate-900 dark:!text-white">{cc.cupon_detalle?.nombre || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[rgb(37,99,235)]/20 dark:!bg-[rgb(37,99,235)]/30 text-[rgb(37,99,235)] dark:!text-[rgb(96,165,250)]">
                    {cc.cantidad_disponible}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    cc.activo
                      ? 'bg-green-100 text-green-800 dark:!bg-green-900 dark:!text-green-300'
                      : 'bg-red-100 text-red-800 dark:!bg-red-900 dark:!text-red-300'
                  }`}>
                    {cc.activo ? <CheckIcon className="h-3 w-3" /> : <XMarkIcon className="h-3 w-3" />}
                    <span>{cc.activo ? 'Activo' : 'Inactivo'}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {cc.activo && cc.cantidad_disponible > 0 && (
                    <button
                      onClick={() => onUsarCupon(cc.id)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] hover:from-[rgb(29,78,216)] hover:to-[rgb(30,64,175)] text-white rounded-xl text-xs font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      <span>Usar Cupón</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-secciones / Modales
// ─────────────────────────────────────────────

/** Modal: Ver cupones de un cliente específico */
function CuponesClienteModal({ cliente, onClose }) {
  const cupones = cliente?.cupones || [];
  const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');

  return (
    <Modal
      isOpen={!!cliente}
      onClose={onClose}
      title={cliente?.tipo_persona === 'JUR' ? cliente?.razon_social : `${cliente?.primer_nombre || ''} ${cliente?.apellidos || ''}`}
      subtitle="Cupones asignados a este cliente"
      icon={UserIcon}
      iconColor="from-[rgb(37,99,235)] to-[rgb(29,78,216)]"
      footer={
        <button onClick={onClose} className="w-full py-3 bg-slate-100 dark:!bg-slate-800 hover:bg-slate-200 dark:hover:!bg-slate-700 text-slate-700 dark:!text-white rounded-xl font-medium transition-all">
          Cerrar
        </button>
      }
    >
      {cupones.length > 0 ? (
        <div className="space-y-3">
          {cupones.map((cc) => (
            <div key={cc.id} className="p-4 bg-slate-50 dark:!bg-slate-800 rounded-xl border border-slate-200 dark:!border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-lg">
                    <TicketIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold dark:!text-white">{cc.cupon_detalle?.nombre || 'N/A'}</p>
                    <p className="text-sm dark:!text-slate-300">{cc.cupon_detalle?.tipo === 'PCT' ? `${cc.cupon_detalle.valor}% descuento` : `$${cc.cupon_detalle.valor} de descuento`}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cc.activo ? 'bg-green-100 text-green-800 dark:!bg-green-900/30 dark:!text-green-300' : 'bg-red-100 text-red-800 dark:!bg-red-900/30 dark:!text-red-300'}`}>
                  {cc.cantidad_disponible} disponibles
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={TicketIcon} title="Sin cupones asignados" subtitle="Este cliente no tiene cupones activos" />
      )}
    </Modal>
  );
}

/** Modal: Gestión de Clientes */
function GestionClientesModal({ isOpen, onClose, clientes, loading, searchQuery, onSearchChange, onVerCupones, onNuevoCliente, onEditarCliente }) {
  // Check if dark mode is active
  const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-mode');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestión de Clientes"
      subtitle="Busca, crea y edita clientes"
      icon={UserIcon}
      iconColor="from-[rgb(37,99,235)] to-[rgb(29,78,216)]"
    >
      <div
        className="space-y-5"
        style={{ backgroundColor: isDarkMode ? '#1e1e1e !important' : 'transparent !important' }}
      >
        {/* Buscador y botón nuevo cliente */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: isDarkMode ? '#cccccc' : '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, cédula o RUC..."
              style={{
                border: '1px solid',
                borderColor: isDarkMode ? '#444444' : '#e2e8f0',
                backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
                color: isDarkMode ? '#f5f5f5' : '#0f172a'
              }}
              className="w-full pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-[rgb(37,99,235)] focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={onNuevoCliente}
            className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex-shrink-0"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Resultados */}
        {loading ? (
          <LoadingSpinner color="purple" text="Buscando clientes..." />
        ) : clientes.length > 0 ? (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: '1px solid',
              borderColor: isDarkMode ? '#444444' : '#e2e8f0',
              backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff !important'
            }}
          >
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: isDarkMode ? '#2a2a2a !important' : '#f8fafc' }}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: isDarkMode ? '#f5f5f5 !important' : '#334155' }}>Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: isDarkMode ? '#f5f5f5 !important' : '#334155' }}>Documento</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: isDarkMode ? '#f5f5f5 !important' : '#334155' }}>Tipo</th>
                  <th className="px-4 py-3 text-right font-semibold" style={{ color: isDarkMode ? '#f5f5f5 !important' : '#334155' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: isDarkMode ? '#1e1e1e !important' : '#ffffff' }}>
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid ${isDarkMode ? '#333333' : '#f1f5f9'}` }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#2a2a2a' : '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={() => onEditarCliente(cliente)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-full flex items-center justify-center flex-shrink-0">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="font-medium truncate max-w-[140px]" style={{ color: isDarkMode ? '#f5f5f5 !important' : '#0f172a' }}>
                          {cliente.tipo_persona === 'JUR' ? cliente.razon_social : `${cliente.primer_nombre || ''} ${cliente.apellidos || ''}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: isDarkMode ? '#cccccc !important' : '#475569' }}>{cliente.numero_documento}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: cliente.tipo_persona === 'JUR'
                            ? (isDarkMode ? '#1e3a8a' : '#dbeafe')
                            : (isDarkMode ? '#581c87' : '#f3e8ff'),
                          color: cliente.tipo_persona === 'JUR'
                            ? (isDarkMode ? '#93c5fd' : '#1e40af')
                            : (isDarkMode ? '#d8b4fe' : '#7e22ce')
                        }}
                      >
                        {cliente.tipo_persona === 'JUR' ? 'Jurídica' : 'Natural'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditarCliente(cliente);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: isDarkMode ? '#312e81 !important' : '#e0e7ff',
                            color: isDarkMode ? '#a5b4fc !important' : '#4338ca'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#3730a3' : '#c7d2fe'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#312e81' : '#e0e7ff'}
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerCupones(cliente);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: isDarkMode ? '#581c87 !important' : '#f3e8ff',
                            color: isDarkMode ? '#d8b4fe !important' : '#7e22ce'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#6b21a8' : '#e9d5ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isDarkMode ? '#581c87' : '#f3e8ff'}
                        >
                          <TicketIcon className="h-3.5 w-3.5" />
                          <span>Ver Cupones</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : searchQuery ? (
          <EmptyState icon={UserIcon} title="No se encontraron clientes" subtitle="Intenta con otro término de búsqueda" />
        ) : (
          <EmptyState icon={MagnifyingGlassIcon} title="Busca clientes para ver resultados" subtitle="Ingresa nombre, cédula o RUC" />
        )}
      </div>
    </Modal>
  );
}

/** Modal: Asignar Cupón */
function AsignarCuponModal({ isOpen, onClose, clientes, cupones, loading, searchQuery, onSearchChange, selectedCliente, onSelectCliente, selectedCupon, onSelectCupon, cantidad, onCantidadChange, onSubmit }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar Cupón a Cliente"
      subtitle="Selecciona un cliente y un cupón"
      icon={GiftIcon}
      iconColor="from-[rgb(37,99,235)] to-[rgb(29,78,216)]"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Buscador de cliente */}
        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Buscar Cliente</label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, cédula o RUC..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Lista de clientes */}
        {loading ? (
          <LoadingSpinner color="blue" text="Buscando clientes..." />
        ) : clientes.length > 0 ? (
          <div className="border border-slate-200 dark:!border-slate-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => onSelectCliente(cliente.id)}
                className={`p-4 cursor-pointer transition-all border-b border-slate-100 dark:!border-slate-800 last:border-b-0 ${selectedCliente === cliente.id ? 'bg-[rgb(37,99,235)]/10 dark:!bg-[rgb(37,99,235)]/20 border-l-4 border-l-[rgb(37,99,235)]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium dark:!text-white truncate">
                      {cliente.email || cliente.nombre || 'Cliente'}
                    </p>
                    <p className="text-sm dark:!text-slate-300">ID: {cliente.id}</p>
                  </div>
                  {selectedCliente === cliente.id && <CheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <EmptyState icon={UserIcon} title="No se encontraron clientes" />
        ) : null}

        {/* Seleccionar cupón */}
        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Seleccionar Cupón</label>
          <select
            value={selectedCupon || ''}
            onChange={(e) => onSelectCupon(Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          >
            <option value="">-- Selecciona un cupón --</option>
            {cupones.map((cupon) => (
              <option key={cupon.id} value={cupon.id}>
                {cupon.nombre} ({cupon.tipo === 'PCT' ? `${cupon.valor}% descuento` : `$${cupon.valor} de descuento`})
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Cantidad a Asignar</label>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => onCantidadChange(Number(e.target.value))}
            className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3 bg-slate-100 dark:!bg-slate-800 hover:bg-slate-200 dark:hover:!bg-slate-700 dark:!text-white text-slate-700 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!selectedCliente || !selectedCupon}
            className="py-3 bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] hover:from-[rgb(29,78,216)] hover:to-[rgb(30,64,175)] disabled:from-slate-300 disabled:to-slate-400 dark:disabled:!from-slate-700 dark:disabled:!to-slate-800 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            <GiftIcon className="h-5 w-5" />
            <span>Asignar</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Componente: Selector de Ciudad con Búsqueda */
function CiudadSelector({ value, onChange, token, label = "Ciudad" }) {
  const [ciudades, setCiudades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const cargarCiudades = useCallback(async (search = '') => {
    if (search.length < 2 && search !== '') return;

    setLoading(true);
    try {
      const data = await fetchCiudades(token);
      // Manejar diferentes formatos de respuesta
      let ciudadesData = [];
      if (Array.isArray(data)) {
        ciudadesData = data;
      } else if (data && typeof data === 'object') {
        ciudadesData = data.cities || data.ciudades || data.results || [];
      }

      // Normalizar estructura de datos (manejar 'nombre' o 'name')
      const normalizadas = ciudadesData.map(c => ({
        nombre: c.nombre || c.name || c.ciudad || '',
        ...c
      })).filter(c => c.nombre); // Solo ciudades con nombre válido

      // Filtrar si hay búsqueda
      const filtradas = search
        ? normalizadas.filter(c =>
            c.nombre.toLowerCase().includes(search.toLowerCase())
          )
        : normalizadas;

      setCiudades(filtradas.slice(0, 50)); // Limitar a 50 resultados
    } catch (err) {
      console.error('Error cargando ciudades:', err);
      setCiudades([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Cargar ciudades al montar y cuando cambia el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => cargarCiudades(inputValue), 300);
    return () => clearTimeout(timer);
  }, [inputValue, cargarCiudades]);

  const opciones = ciudades.map(c => ({
    value: c.nombre,
    label: c.nombre
  })).filter(c => c.value && c.label); // Filtrar opciones inválidas

  const valorActual = value ? { value, label: value } : null;

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:!text-slate-300 mb-2">{label} *</label>
      <Select
        value={valorActual}
        onChange={(opcion) => onChange(opcion ? opcion.value : '')}
        options={opciones}
        inputValue={inputValue}
        onInputChange={setInputValue}
        isLoading={loading}
        isClearable
        placeholder="Selecciona una ciudad..."
        noOptionsMessage={() => inputValue.length > 0 && inputValue.length < 2 ? 'Escribe al menos 2 caracteres' : 'Escribe para buscar...'}
        loadingMessage={() => 'Buscando...'}
        className="react-select-container"
        classNamePrefix="react-select"
        components={{
          DropdownIndicator: () => (
            <div className="p-2 text-slate-400 dark:!text-slate-500">
              <ChevronDownIcon className="h-5 w-5" />
            </div>
          ),
          IndicatorSeparator: () => null,
        }}
      />
    </div>
  );
}

/** Modal: Crear/Editar Cliente */
function CrearEditarClienteModal({ isOpen, onClose, onSubmit, cliente, onChange, esEdicion, token, errores = {} }) {
  // Función auxiliar para mostrar error de campo
  const mostrarError = (campo) => errores[campo];

  // Función auxiliar para clases de input con error
  const clasesInput = (campo) => {
    const tieneError = errores[campo];
    return `w-full px-4 py-3 ${tieneError ? 'pr-10' : ''} border ${tieneError ? 'border-red-500 bg-red-50 dark:!bg-red-900/10' : 'border-slate-200 dark:!border-slate-700'} rounded-xl ${tieneError ? 'text-red-900 dark:text-red-200' : 'bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100'} focus:ring-2 ${tieneError ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-transparent'} transition-all`;
  };

  // Wrapper para input con mensaje de error
  const CampoConError = ({ campo, children }) => (
    <div className="relative">
      {children}
      {errores[campo] && (
        <ExclamationTriangleIcon className="absolute right-3 top-10 h-5 w-5 text-red-500 pointer-events-none" />
      )}
      {errores[campo] && (
        <p className="mt-1 text-xs text-red-600 dark:!text-red-400 flex items-center gap-1">
          <ExclamationTriangleIcon className="h-3 w-3" />
          {errores[campo]}
        </p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar Cliente' : 'Nuevo Cliente'}
      subtitle={esEdicion ? 'Modifica los datos del cliente' : 'Completa los datos del nuevo cliente'}
      icon={UserIcon}
      iconColor="from-[rgb(37,99,235)] to-[rgb(29,78,216)]"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <style>{`
          .react-select-container {
            font-size: 0.875rem;
          }
        `}</style>
        {/* Tipo de persona */}
        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Tipo de Persona *</label>
          <select
            required
            value={cliente.tipo_persona}
            onChange={(e) => onChange({ ...cliente, tipo_persona: e.target.value })}
            className={clasesInput('tipo_persona')}
          >
            <option value="NAT">Natural</option>
            <option value="JUR">Jurídica (Empresa)</option>
          </select>
          {mostrarError('tipo_persona') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('tipo_persona')}</p>}
        </div>

        {cliente.tipo_persona === 'NAT' ? (
          // Persona Natural
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold dark:!text-white mb-2">Primer Nombre *</label>
              <input
                type="text"
                required={cliente.tipo_persona === 'NAT'}
                value={cliente.primer_nombre}
                onChange={(e) => onChange({ ...cliente, primer_nombre: e.target.value })}
                placeholder="Juan"
                className={clasesInput('primer_nombre')}
              />
              {mostrarError('primer_nombre') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('primer_nombre')}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold dark:!text-white mb-2">Segundo Nombre</label>
              <input
                type="text"
                value={cliente.segundo_nombre}
                onChange={(e) => onChange({ ...cliente, segundo_nombre: e.target.value })}
                placeholder="Carlos"
                className={clasesInput('segundo_nombre')}
              />
              {mostrarError('segundo_nombre') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('segundo_nombre')}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold dark:!text-white mb-2">Apellidos *</label>
              <input
                type="text"
                required={cliente.tipo_persona === 'NAT'}
                value={cliente.apellidos}
                onChange={(e) => onChange({ ...cliente, apellidos: e.target.value })}
                placeholder="Pérez García"
                className={clasesInput('apellidos')}
              />
              {mostrarError('apellidos') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('apellidos')}</p>}
            </div>
          </div>
        ) : (
          // Persona Jurídica
          <div>
            <label className="block text-sm font-semibold dark:!text-white mb-2">Razón Social *</label>
            <input
              type="text"
              required={cliente.tipo_persona === 'JUR'}
              value={cliente.razon_social}
              onChange={(e) => onChange({ ...cliente, razon_social: e.target.value })}
              placeholder="Mi Empresa S.A."
              className={clasesInput('razon_social')}
            />
            {mostrarError('razon_social') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('razon_social')}</p>}
          </div>
        )}

        {/* Tipo y número de documento */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold dark:!text-white mb-2">Tipo Documento *</label>
            <select
              required
              value={cliente.tipo_documento}
              onChange={(e) => onChange({ ...cliente, tipo_documento: e.target.value })}
              className={clasesInput('tipo_documento')}
            >
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="NIT">NIT</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta de Identidad</option>
              <option value="PP">Pasaporte</option>
            </select>
            {mostrarError('tipo_documento') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('tipo_documento')}</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold dark:!text-white mb-2">Número Documento *</label>
            <input
              type="text"
              required
              value={cliente.numero_documento}
              onChange={(e) => onChange({ ...cliente, numero_documento: e.target.value })}
              placeholder="1234567890"
              className={clasesInput('numero_documento')}
            />
            {mostrarError('numero_documento') && (
              <ExclamationTriangleIcon className="absolute right-3 top-[2.4rem] h-5 w-5 text-red-500 pointer-events-none" />
            )}
            {mostrarError('numero_documento') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{mostrarError('numero_documento')}</p>}
          </div>
        </div>

        {/* Información de contacto */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 relative">
            <label className="block text-sm font-semibold dark:!text-white mb-2">Correo Electrónico *</label>
            <input
              type="email"
              required
              value={cliente.correo}
              onChange={(e) => onChange({ ...cliente, correo: e.target.value })}
              placeholder="cliente@ejemplo.com"
              className={clasesInput('correo')}
            />
            {mostrarError('correo') && (
              <ExclamationTriangleIcon className="absolute right-3 top-[2.4rem] h-5 w-5 text-red-500 pointer-events-none" />
            )}
            {mostrarError('correo') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{mostrarError('correo')}</p>}
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold dark:!text-white mb-2">Teléfono *</label>
            <input
              type="tel"
              required
              value={cliente.telefono}
              onChange={(e) => onChange({ ...cliente, telefono: e.target.value })}
              placeholder="0991234567"
              className={clasesInput('telefono')}
            />
            {mostrarError('telefono') && (
              <ExclamationTriangleIcon className="absolute right-3 top-[2.4rem] h-5 w-5 text-red-500 pointer-events-none" />
            )}
            {mostrarError('telefono') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400 flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" />{mostrarError('telefono')}</p>}
          </div>
          <div className="col-span-2">
            <CiudadSelector
              value={cliente.ciudad}
              onChange={(valor) => onChange({ ...cliente, ciudad: valor })}
              token={token}
              label="Ciudad"
            />
            {mostrarError('ciudad') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('ciudad')}</p>}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Dirección</label>
          <input
            type="text"
            value={cliente.direccion}
            onChange={(e) => onChange({ ...cliente, direccion: e.target.value })}
            placeholder="Calle 123 # 45-67"
            className={clasesInput('direccion')}
          />
          {mostrarError('direccion') && <p className="mt-1 text-xs text-red-600 dark:!text-red-400">{mostrarError('direccion')}</p>}
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3 bg-slate-100 dark:!bg-slate-800 hover:bg-slate-200 dark:hover:!bg-slate-700 dark:!text-white text-slate-700 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-3 bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            {esEdicion ? (
              <>
                <PencilIcon className="h-5 w-5" />
                <span>Guardar Cambios</span>
              </>
            ) : (
              <>
                <PlusIcon className="h-5 w-5" />
                <span>Crear Cliente</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Modal: Crear Cupón */
function CrearCuponModal({ isOpen, onClose, onSubmit, cupon, onChange }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Cupón"
      subtitle="Configura un cupón de descuento"
      icon={PlusIcon}
      iconColor="from-green-500 to-green-600"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold dark:!text-white mb-2">Código *</label>
            <input
              type="text"
              required
              value={cupon.codigo}
              onChange={(e) => onChange({ ...cupon, codigo: e.target.value.toUpperCase() })}
              placeholder="Ej: VERANO2024"
              className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold dark:!text-white mb-2">Tipo *</label>
            <select
              required
              value={cupon.tipo}
              onChange={(e) => onChange({ ...cupon, tipo: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            >
              <option value="PORCENTAJE">Porcentaje</option>
              <option value="MONTO_FIJO">Monto Fijo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Descripción</label>
          <input
            type="text"
            value={cupon.descripcion}
            onChange={(e) => onChange({ ...cupon, descripcion: e.target.value })}
            placeholder="Ej: Descuento de temporada"
            className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {cupon.tipo === 'PORCENTAJE' ? (
            <div>
              <label className="block text-sm font-semibold dark:!text-white mb-2">Descuento (%) *</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  step="0.01"
                  value={cupon.porcentaje_descuento}
                  onChange={(e) => onChange({ ...cupon, porcentaje_descuento: e.target.value })}
                  placeholder="Ej: 10"
                  className="w-full px-4 py-3 pr-10 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold dark:!text-white mb-2">Monto Fijo ($) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={cupon.monto_fijo}
                  onChange={(e) => onChange({ ...cupon, monto_fijo: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold dark:!text-white mb-2">Vencimiento</label>
            <input
              type="date"
              value={cupon.fecha_vencimiento}
              onChange={(e) => onChange({ ...cupon, fecha_vencimiento: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold dark:!text-white mb-2">Cantidad Máxima de Usos (por cliente)</label>
          <input
            type="number"
            min="1"
            value={cupon.cantidad_maxima}
            onChange={(e) => onChange({ ...cupon, cantidad_maxima: e.target.value })}
            placeholder="Sin límite si está vacío"
            className="w-full px-4 py-3 border border-slate-200 dark:!border-slate-700 rounded-xl bg-white dark:!bg-slate-800 text-slate-900 dark:!text-slate-100 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 p-4 bg-slate-50 dark:!bg-slate-800/50 rounded-xl">
          <input
            type="checkbox"
            id="activo"
            checked={cupon.activo}
            onChange={(e) => onChange({ ...cupon, activo: e.target.checked })}
            className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500"
          />
          <label htmlFor="activo" className="text-sm font-medium dark:!text-white cursor-pointer">
            Cupón activo (disponible para asignar)
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 bg-slate-100 dark:!bg-slate-800 hover:bg-slate-200 dark:hover:!bg-slate-700 text-slate-700 dark:!text-slate-200 rounded-xl font-semibold transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="py-3.5 bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] hover:from-[rgb(29,78,216)] hover:to-[rgb(30,64,175)] text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Crear Cupón</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Vista principal
// ─────────────────────────────────────────────

const CUPON_VACIO = {
  codigo: '',
  descripcion: '',
  porcentaje_descuento: '',
  monto_fijo: '',
  fecha_vencimiento: '',
  activo: true,
  cantidad_maxima: '',
  tipo: 'PORCENTAJE'
};

const CLIENTE_VACIO = {
  tipo_persona: 'NAT',
  primer_nombre: '',
  segundo_nombre: '',
  apellidos: '',
  razon_social: '',
  tipo_documento: 'CC',
  numero_documento: '',
  correo: '',
  telefono: '',
  direccion: '',
  ciudad: ''
};

export default function ClientesView() {
  const { usuario, tokenUsuario, subdominio } = useAuth();

  // Datos
  const [clientes, setClientes] = useState([]);
  const [cupones, setCupones] = useState([]);
  const [clienteCupones, setClienteCupones] = useState([]);

  // Loading
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingCupones, setLoadingCupones] = useState(false);
  const [loadingClienteCupones, setLoadingClienteCupones] = useState(false);

  // Búsqueda separada para cada modal
  const [searchAsignar, setSearchAsignar] = useState('');
  const [searchGestion, setSearchGestion] = useState('');

  // Formulario de asignar
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedCupon, setSelectedCupon] = useState(null);
  const [cantidadAsignar, setCantidadAsignar] = useState(1);

  // Nuevo cupón
  const [nuevoCupon, setNuevoCupon] = useState(CUPON_VACIO);

  // Cliente a editar
  const [clienteEditando, setClienteEditando] = useState(null);
  const [datosCliente, setDatosCliente] = useState(CLIENTE_VACIO);
  const [erroresFormulario, setErroresFormulario] = useState({});

  // Estado de modales
  const [modalGestion, setModalGestion] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [modalCrearCupon, setModalCrearCupon] = useState(false);
  const [modalCrearEditarCliente, setModalCrearEditarCliente] = useState(false);
  const [clienteParaCupones, setClienteParaCupones] = useState(null);

  // Estados para cupones
  const [creandoCupon, setCreandoCupon] = useState(false);
  const [asignandoCupon, setAsignandoCupon] = useState(false);
  const [erroresCupon, setErroresCupon] = useState({});

  // ── API ──────────────────────────────────────

  const fetchClientes = useCallback(async (query = '') => {
    setLoadingClientes(true);
    try {
      // Usar el endpoint de clientes tienda (e-commerce) en lugar de clientes fiscales
      const queryParam = query ? `?query=${encodeURIComponent(query)}` : '';
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/clientes-tienda/${queryParam}&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClientes(Array.isArray(data.clientes_tienda) ? data.clientes_tienda : []);
    } catch {
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  }, [usuario, tokenUsuario, subdominio]);

  const fetchCupones = useCallback(async () => {
    setLoadingCupones(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/?activos=true&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCupones(data.cupones || []);
    } catch {
      setCupones([]);
    } finally {
      setLoadingCupones(false);
    }
  }, [usuario, tokenUsuario, subdominio]);

  const fetchClienteCupones = useCallback(async () => {
    setLoadingClienteCupones(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/?usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClienteCupones(data.cliente_cupones || []);
    } catch {
      setClienteCupones([]);
    } finally {
      setLoadingClienteCupones(false);
    }
  }, [usuario, tokenUsuario, subdominio]);

  const fetchCuponesPorCliente = async (clienteId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/cliente/${clienteId}/?solo_activos=true&usuario=${usuario}&token=${tokenUsuario}&subdominio=${subdominio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.cupones || [];
    } catch {
      return [];
    }
  };

  const handleCrearCupon = async (e) => {
    e.preventDefault();

    // Validar antes de enviar
    const errores = validarCupon(nuevoCupon);
    if (Object.keys(errores).length > 0) {
      const primerError = Object.values(errores)[0];
      showToast('error', primerError);
      setErroresCupon(errores);
      return;
    }

    setErroresCupon({});
    setCreandoCupon(true);

    try {
      // Mapear campos de frontend a backend
      const payload = {
        nombre: nuevoCupon.codigo, // Frontend 'codigo' -> Backend 'nombre'
        tipo: nuevoCupon.tipo === 'PORCENTAJE' ? 'PCT' : 'VAL', // Enum mapping
        valor: nuevoCupon.tipo === 'PORCENTAJE'
          ? parseFloat(nuevoCupon.porcentaje_descuento)
          : parseFloat(nuevoCupon.monto_fijo), // Both use 'valor'
        activo: nuevoCupon.activo,
        fecha_vencimiento: nuevoCupon.fecha_vencimiento || null,
        usuario,
        token: tokenUsuario,
        subdominio
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw { message: data.detail || 'Error al crear cupón', details: data };

      await fetchCupones();
      setModalCrearCupon(false);
      setNuevoCupon(CUPON_VACIO);
      showToast('success', `Cupón "${nuevoCupon.codigo}" creado exitosamente`);
    } catch (err) {
      const mensajeError = obtenerMensajeErrorCupon(err, 'crear');
      showToast('error', mensajeError);
    } finally {
      setCreandoCupon(false);
    }
  };

  const handleAsignarCupon = async (e) => {
    e.preventDefault();

    // Validar
    const errores = validarAsignacionCupon(selectedCliente, selectedCupon, cantidadAsignar);
    if (Object.keys(errores).length > 0) {
      const primerError = Object.values(errores)[0];
      showToast('error', primerError);
      return;
    }

    setAsignandoCupon(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_tienda_id: selectedCliente,
          cupon_id: selectedCupon,
          cantidad_disponible: cantidadAsignar,
          activo: true,
          usuario,
          token: tokenUsuario,
          subdominio
        })
      });

      const data = await res.json();
      if (!res.ok) throw { message: data.detail || 'Error al asignar cupón', details: data };

      await fetchClienteCupones();
      setModalAsignar(false);
      setSelectedCliente(null);
      setSelectedCupon(null);
      setCantidadAsignar(1);
      setSearchAsignar('');
      showToast('success', `${cantidadAsignar} cupón(es) asignado(s) exitosamente`);
    } catch (err) {
      const mensajeError = obtenerMensajeErrorCupon(err, 'asignar');
      showToast('error', mensajeError);
    } finally {
      setAsignandoCupon(false);
    }
  };

  const handleUsarCupon = async (clienteCuponId) => {
    if (!confirm('¿Confirmar uso de este cupón?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cupones/cliente-cupones/${clienteCuponId}/usar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, token: tokenUsuario, subdominio })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al usar cupón');
      }
      await fetchClienteCupones();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerCuponesCliente = async (cliente) => {
    setClienteParaCupones({ ...cliente, cupones: [] });
    const cupones = await fetchCuponesPorCliente(cliente.id);
    setClienteParaCupones({ ...cliente, cupones });
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();

    // Limpiar errores anteriores
    setErroresFormulario({});

    // Validaciones antes de enviar al backend
    const errores = validarCliente(datosCliente);
    if (Object.keys(errores).length > 0) {
      setErroresFormulario(errores);
      const primerError = Object.values(errores)[0];
      showToast('error', primerError);
      return;
    }

    try {
      if (clienteEditando) {
        // Editar cliente existente
        await editarCliente({
          clienteId: clienteEditando.id,
          token: tokenUsuario,
          usuario,
          subdominio,
          datos: datosCliente
        });
        showToast('success', 'Cliente actualizado correctamente');
      } else {
        // Crear nuevo cliente
        await crearCliente({
          token: tokenUsuario,
          usuario,
          subdominio,
          datos: datosCliente
        });
        showToast('success', 'Cliente creado correctamente');
      }

      // Refrescar lista de clientes si el modal de gestión está abierto
      if (modalGestion) {
        await fetchClientes(searchGestion);
      }

      // Cerrar modal y limpiar formulario
      setModalCrearEditarCliente(false);
      setClienteEditando(null);
      setDatosCliente(CLIENTE_VACIO);
      setErroresFormulario({});
    } catch (err) {
      // Manejo de errores más amigable
      const mensajeError = obtenerMensajeErrorAmigable(err);
      showToast('error', mensajeError);
    }
  };

  // Validar datos del cliente antes de enviar
  const validarCliente = (cliente) => {
    const errores = {};

    // Validar campos según tipo de persona
    if (cliente.tipo_persona === 'NAT') {
      if (!cliente.primer_nombre?.trim()) {
        errores.primer_nombre = 'El primer nombre es obligatorio';
      }
      if (!cliente.apellidos?.trim()) {
        errores.apellidos = 'Los apellidos son obligatorios';
      }
    } else if (cliente.tipo_persona === 'JUR') {
      if (!cliente.razon_social?.trim()) {
        errores.razon_social = 'La razón social es obligatoria';
      }
    }

    // Validar documento
    if (!cliente.tipo_documento) {
      errores.tipo_documento = 'Selecciona el tipo de documento';
    }
    if (!cliente.numero_documento?.trim()) {
      errores.numero_documento = 'El número de documento es obligatorio';
    } else if (cliente.numero_documento.length < 5) {
      errores.numero_documento = 'Debe tener al menos 5 caracteres';
    }

    // Validar email
    if (!cliente.correo?.trim()) {
      errores.correo = 'El correo es obligatorio';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cliente.correo)) {
        errores.correo = 'Email no válido. Ejemplo: cliente@ejemplo.com';
      }
    }

    // Validar teléfono
    if (!cliente.telefono?.trim()) {
      errores.telefono = 'El teléfono es obligatorio';
    } else if (cliente.telefono.length < 7) {
      errores.telefono = 'Debe tener al menos 7 dígitos';
    }

    return errores;
  };

  // Validar datos del cupón antes de enviar
  const validarCupon = (cupon) => {
    const errores = {};

    // Validar código
    if (!cupon.codigo?.trim()) {
      errores.codigo = 'El código es obligatorio';
    } else if (cupon.codigo.length < 3) {
      errores.codigo = 'El código debe tener al menos 3 caracteres';
    } else if (!/^[A-Z0-9_-]+$/.test(cupon.codigo)) {
      errores.codigo = 'Solo letras, números, guiones y guiones bajos';
    }

    // Validar tipo
    if (!cupon.tipo || !['PORCENTAJE', 'MONTO_FIJO'].includes(cupon.tipo)) {
      errores.tipo = 'Selecciona el tipo de descuento';
    }

    // Validar valor según tipo
    if (cupon.tipo === 'PORCENTAJE') {
      if (!cupon.porcentaje_descuento && cupon.porcentaje_descuento !== 0) {
        errores.porcentaje_descuento = 'El descuento es obligatorio';
      } else {
        const val = parseFloat(cupon.porcentaje_descuento);
        if (isNaN(val) || val < 0.01 || val > 100) {
          errores.porcentaje_descuento = 'Debe estar entre 0.01 y 100%';
        }
      }
    } else if (cupon.tipo === 'MONTO_FIJO') {
      if (!cupon.monto_fijo && cupon.monto_fijo !== 0) {
        errores.monto_fijo = 'El monto es obligatorio';
      } else {
        const val = parseFloat(cupon.monto_fijo);
        if (isNaN(val) || val < 0.01 || val > 999999.99) {
          errores.monto_fijo = 'Monto inválido (0.01 - 999999.99)';
        }
      }
    }

    // Validar fecha futura
    if (cupon.fecha_vencimiento) {
      const fecha = new Date(cupon.fecha_vencimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (fecha <= hoy) {
        errores.fecha_vencimiento = 'La fecha debe ser futura';
      }
    }

    return errores;
  };

  const validarAsignacionCupon = (selectedCliente, selectedCupon, cantidad) => {
    const errores = {};
    if (!selectedCliente) errores.cliente = 'Selecciona un cliente de la lista';
    if (!selectedCupon) errores.cupon = 'Selecciona un cupón';
    if (!cantidad || cantidad < 1 || cantidad > 999) {
      errores.cantidad = 'Cantidad entre 1 y 999';
    }
    return errores;
  };

  const obtenerMensajeErrorCupon = (err, contexto = 'general') => {
    const msg = err?.message || err?.detail || '';
    const details = err?.details;

    // Errores específicos de cupones
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('Ya existe')) {
      return 'Ya existe un cupón con ese código. Usa un código diferente.';
    }
    if (msg.includes('cliente_tienda_id') || msg.includes('ClienteTienda')) {
      return 'El cliente seleccionado no es válido. Intenta buscar nuevamente.';
    }
    if (msg.includes('cupon_id') || msg.includes('Cupón')) {
      return 'El cupón seleccionado no es válido. Intenta nuevamente.';
    }
    if (msg.includes('vencido') || msg.includes('vencimiento')) {
      return 'El cupón ha vencido y no puede ser asignado.';
    }
    if (msg.includes('TOKEN') || msg.includes('Usuario no encontrado')) {
      return 'Tu sesión ha expirado. Recarga la página.';
    }
    if (msg.includes('SESSION_EXPIRED') || msg.includes('fetch') || msg.includes('Network')) {
      return 'Error de conexión. Verifica tu internet.';
    }
    if (msg.includes('500') || msg.includes('Internal Server Error')) {
      return 'Error del servidor. Intenta en unos minutos.';
    }

    // Contexto específico
    if (contexto === 'crear') return msg || 'Error al crear el cupón. Verifica los datos.';
    if (contexto === 'asignar') return msg || 'Error al asignar el cupón. Intenta nuevamente.';

    return msg || 'Ha ocurrido un error inesperado.';
  };

  // Función para obtener mensajes de error amigables
  const obtenerMensajeErrorAmigable = (err) => {
    const msg = err.message || '';
    const details = err.details;

    // Error de documento duplicado
    if (msg.includes('Ya existe un cliente con este número de documento') ||
        msg.includes('numero_documento') ||
        msg.includes('unique') ||
        (details && details.numero_documento)) {
      return 'Este número de documento ya está registrado. Verifica que los datos sean correctos o usa un número diferente.';
    }

    // Error de campos requeridos
    if (msg.includes('required') || msg.includes('This field is required')) {
      return 'Por favor completa todos los campos obligatorios (marcados con *)';
    }

    // Error de email inválido
    if (msg.includes('email') || msg.includes('Enter a valid email')) {
      return 'El correo electrónico no es válido. Ejemplo: cliente@ejemplo.com';
    }

    // Error de token o autenticación
    if (msg.includes('TOKEN') || msg.includes('token') || msg.includes('Usuario no encontrado')) {
      return 'Tu sesión ha expirado. Recarga la página para continuar.';
    }

    // Error de conexión
    if (msg.includes('SESSION_EXPIRED') || msg.includes('fetch') || msg.includes('Network')) {
      return 'Error de conexión. Verifica tu internet e intenta nuevamente.';
    }

    // Error de servidor (500)
    if (msg.includes('500') || msg.includes('Internal Server Error')) {
      return 'Error del servidor. Por favor intenta en unos minutos.';
    }

    // Error genérico
    if (msg.length > 150) {
      return 'Ha ocurrido un error inesperado. Por favor intenta nuevamente.';
    }

    // Mensaje original si es corto y claro
    return msg || 'Error al guardar el cliente. Por favor intenta nuevamente.';
  };

  const handleNuevoCliente = () => {
    setClienteEditando(null);
    setDatosCliente(CLIENTE_VACIO);
    setErroresFormulario({});
    setModalCrearEditarCliente(true);
  };

  const handleEditarCliente = (cliente) => {
    setClienteEditando(cliente);
    setDatosCliente({
      tipo_persona: cliente.tipo_persona || 'NAT',
      primer_nombre: cliente.primer_nombre || '',
      segundo_nombre: cliente.segundo_nombre || '',
      apellidos: cliente.apellidos || '',
      razon_social: cliente.razon_social || '',
      tipo_documento: cliente.tipo_documento || 'CC',
      numero_documento: cliente.numero_documento || '',
      correo: cliente.correo || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || ''
    });
    setErroresFormulario({});
    setModalCrearEditarCliente(true);
  };

  const closeModalCrearEditarCliente = () => {
    setModalCrearEditarCliente(false);
    setClienteEditando(null);
    setDatosCliente(CLIENTE_VACIO);
  };

  // ── Effects ──────────────────────────────────

  useEffect(() => {
    fetchCupones();
    fetchClienteCupones();
  }, []);

  // Debounce búsqueda modal asignar
  useEffect(() => {
    if (!modalAsignar) return;
    const id = setTimeout(() => fetchClientes(searchAsignar), 500);
    return () => clearTimeout(id);
  }, [searchAsignar, modalAsignar]);

  // Debounce búsqueda modal gestion
  useEffect(() => {
    if (!modalGestion) return;
    const id = setTimeout(() => fetchClientes(searchGestion), 500);
    return () => clearTimeout(id);
  }, [searchGestion, modalGestion]);

  // Limpiar búsquedas al cerrar modales
  const closeModalAsignar = () => {
    setModalAsignar(false);
    setSearchAsignar('');
    setClientes([]);
    setSelectedCliente(null);
    setSelectedCupon(null);
    setCantidadAsignar(1);
  };

  const closeModalGestion = () => {
    setModalGestion(false);
    setSearchGestion('');
    setClientes([]);
  };

  // ── Render ───────────────────────────────────

  const stats = [
    { title: 'Total Cupones', value: cupones.length, icon: TicketIcon, color: 'from-[rgb(37,99,235)] to-[rgb(29,78,216)]', bgColor: 'bg-[rgb(37,99,235)]/10 dark:!bg-[rgb(37,99,235)]/20' },
    { title: 'Asignaciones Activas', value: clienteCupones.filter(cc => cc.activo).length, icon: GiftIcon, color: 'from-[rgb(37,99,235)] to-[rgb(29,78,216)]', bgColor: 'bg-[rgb(37,99,235)]/10 dark:!bg-[rgb(37,99,235)]/20' },
    { title: 'Total Asignaciones', value: clienteCupones.length, icon: UserIcon, color: 'from-[rgb(37,99,235)] to-[rgb(29,78,216)]', bgColor: 'bg-[rgb(37,99,235)]/10 dark:!bg-[rgb(37,99,235)]/20' }
  ];

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-xl shadow-lg">
          <SparklesIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:!text-white" style={{ color: 'var(--tw-dark-text-white, #ffffff)' }}>Gestión de Clientes</h3>
          <p className="text-sm text-slate-600 dark:!text-slate-300" style={{ color: 'var(--tw-dark-text-slate-300, #cbd5e1)' }}>Administra cupones y clientes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Acciones principales */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleNuevoCliente}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] text-white shadow-sm hover:shadow-md hover:from-[rgb(29,78,216)] hover:to-[rgb(30,64,175)] transition-all duration-200"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Nuevo Cliente</span>
        </button>
        <button
          onClick={() => setModalGestion(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-white dark:!bg-slate-800 dark:!text-white text-slate-600 hover:bg-[rgb(37,99,235)]/10 dark:hover:!bg-[rgb(37,99,235)]/30 hover:text-[rgb(37,99,235)] dark:hover:!text-[rgb(96,165,250)] ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-[rgb(37,99,235)] transition-all duration-200"
        >
          <UserIcon className="h-4 w-4" />
          <span>Gestión Clientes</span>
        </button>

        <button
          onClick={() => setModalAsignar(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-white dark:!bg-slate-800 dark:!text-white text-slate-600 hover:bg-[rgb(37,99,235)]/10 dark:hover:!bg-[rgb(37,99,235)]/30 hover:text-[rgb(37,99,235)] dark:hover:!text-[rgb(96,165,250)] ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-[rgb(37,99,235)] transition-all duration-200"
        >
          <GiftIcon className="h-4 w-4" />
          <span>Asignar Cupón</span>
        </button>

        <button
          onClick={() => setModalCrearCupon(true)}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] text-white shadow-sm hover:shadow-md hover:from-[rgb(29,78,216)] hover:to-[rgb(30,64,175)] transition-all duration-200"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Crear Cupón</span>
        </button>
      </div>

      {/* Tabla de asignaciones */}
      <AsignacionesTable
        loading={loadingClienteCupones}
        clienteCupones={clienteCupones}
        onRefresh={fetchClienteCupones}
        onUsarCupon={handleUsarCupon}
      />

      {/* ── Modales ── */}

      <GestionClientesModal
        isOpen={modalGestion}
        onClose={closeModalGestion}
        clientes={clientes}
        loading={loadingClientes}
        searchQuery={searchGestion}
        onSearchChange={setSearchGestion}
        onVerCupones={handleVerCuponesCliente}
        onNuevoCliente={handleNuevoCliente}
        onEditarCliente={handleEditarCliente}
      />

      <AsignarCuponModal
        isOpen={modalAsignar}
        onClose={closeModalAsignar}
        clientes={clientes}
        cupones={cupones}
        loading={loadingClientes}
        searchQuery={searchAsignar}
        onSearchChange={setSearchAsignar}
        selectedCliente={selectedCliente}
        onSelectCliente={setSelectedCliente}
        selectedCupon={selectedCupon}
        onSelectCupon={setSelectedCupon}
        cantidad={cantidadAsignar}
        onCantidadChange={setCantidadAsignar}
        onSubmit={handleAsignarCupon}
      />

      <CrearCuponModal
        isOpen={modalCrearCupon}
        onClose={() => { setModalCrearCupon(false); setNuevoCupon(CUPON_VACIO); }}
        onSubmit={handleCrearCupon}
        cupon={nuevoCupon}
        onChange={setNuevoCupon}
      />

      <CuponesClienteModal
        cliente={clienteParaCupones}
        onClose={() => setClienteParaCupones(null)}
      />

      <CrearEditarClienteModal
        isOpen={modalCrearEditarCliente}
        onClose={closeModalCrearEditarCliente}
        onSubmit={handleGuardarCliente}
        cliente={datosCliente}
        onChange={setDatosCliente}
        esEdicion={!!clienteEditando}
        token={tokenUsuario}
        errores={erroresFormulario}
      />
    </div>
  );
}