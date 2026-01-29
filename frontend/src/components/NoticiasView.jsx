// src/components/NoticiasView.jsx
import React from 'react';
import DashboardCarousel from './DashboardCarousel';
import { showToast } from '../utils/toast';

export default function NoticiasView() {
  return (
    <section className="w-full max-w-6xl space-y-6">
      {/* Carrusel de Noticias */}
      <DashboardCarousel />

      {/* Link del Catálogo */}
      <div className="max-w-screen-xl mx-auto px-6 py-4 bg-white rounded-lg shadow-md flex items-center justify-between space-x-6">
        {/* Izquierda: input + botones */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <input
            type="text"
            readOnly
            value="https://mi-tienda.com/catalogo"
            className="
              w-64 px-5 py-3
              border border-gray-300 rounded-lg
              text-blue-600 text-sm font-medium
              cursor-pointer select-all
              focus:outline-none focus:ring-2 focus:ring-blue-400
              transition
            "
            onClick={e => e.target.select()}
          />
          <a
            href="https://mi-tienda.com/catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="
              bg-blue-600 hover:bg-blue-700
              text-white font-semibold text-sm
              px-6 py-3 rounded-lg shadow-md
              transition
              duration-300
              ease-in-out
            "
          >
            Mi Catálogo
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://mi-tienda.com/catalogo');
              showToast('success', '¡Link copiado!');
            }}
            className="
              px-6 py-3
              rounded-lg font-semibold text-sm
              bg-gray-200 text-gray-700
              hover:bg-gray-300
              transition
              duration-300
              ease-in-out
              shadow-sm
            "
          >
            Copiar
          </button>
        </div>

        {/* Derecha: descripción */}
        <p className="text-gray-700 max-w-md text-sm leading-relaxed">
          Comparte el link de tu catálogo para que tus clientes puedan ver todos tus productos fácilmente.
        </p>
      </div>
    </section>
  );
}
