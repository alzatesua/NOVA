// src/components/ReportesView.jsx
import React, { useState } from 'react';

export default function ReportesView() {
  const [selectedReport, setSelectedReport] = useState('ventas');

  return (
    <section className="w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-800">Reportes</h3>
        
        {/* Selector de tipo de reporte */}
        <select
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ventas">Ventas</option>
          <option value="inventario">Inventario</option>
          <option value="productos">Productos</option>
          <option value="clientes">Clientes</option>
        </select>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-12">
          <h4 className="text-xl font-semibold text-gray-700 mb-2">
            Reporte de {selectedReport}
          </h4>
          <p className="text-gray-500">
            Esta sección está en desarrollo...
          </p>
        </div>
      </div>
    </section>
  );
}