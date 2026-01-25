// src/components/FacturacionView.jsx
import React, { useState } from 'react';

export default function FacturacionView() {
  const [selectedPeriod, setSelectedPeriod] = useState('mes');

  return (
    <section className="w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Facturación</h3>
        
        {/* Selector de período */}
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="dia">Hoy</option>
          <option value="semana">Esta semana</option>
          <option value="mes">Este mes</option>
          <option value="año">Este año</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card Total Facturado */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Total Facturado</h4>
            <p className="text-2xl font-bold text-blue-600">$0</p>
          </div>

          {/* Card Total Facturas */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Total Facturas</h4>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>

          {/* Card Promedio */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Promedio</h4>
            <p className="text-2xl font-bold text-purple-600">$0</p>
          </div>
        </div>

        <div className="text-center py-8 text-gray-500">
          <p>No hay datos de facturación para mostrar</p>
          <p className="text-sm mt-2">Esta sección está en desarrollo...</p>
        </div>
      </div>
    </section>
  );
}