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
      <div className="max-w-screen-xl mx-auto px-6 py-4 bg-white dark:!bg-slate-900 rounded-lg shadow-md border border-slate-200 dark:!border-slate-800 flex items-center justify-between space-x-6 transition-colors duration-200">
        {/* Izquierda: input + botones */}
        <div className="flex items-center space-x-4 flex-shrink-0">
          <input
            type="text"
            readOnly
            value="https://mi-tienda.com/catalogo"
            className="
              w-64 px-5 py-3
              border border-slate-300 dark:!border-slate-700 rounded-lg
              text-blue-600 dark:text-blue-400 text-sm font-medium
              cursor-pointer select-all
              focus:outline-none focus:ring-2 focus:ring-blue-400
              transition transition-colors duration-200
              bg-slate-50 dark:!bg-slate-800
            "
            onClick={e => e.target.select()}
          />
          <a
            href="https://mi-tienda.com/catalogo"
            target="_blank"
            rel="noopener noreferrer"
            className="
              bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800
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
              bg-slate-200 dark:!bg-slate-700 text-slate-700 dark:!text-slate-300
              hover:bg-slate-300 dark:hover:!bg-slate-600
              transition
              duration-300
              ease-in-out
              shadow-sm
              transition-colors duration-200
            "
          >
            Copiar
          </button>
        </div>

        {/* Derecha: descripción */}
        <p className="text-slate-700 dark:!text-slate-300 max-w-md text-sm leading-relaxed transition-colors duration-200">
          Comparte el link de tu catálogo para que tus clientes puedan ver todos tus productos fácilmente.
        </p>
      </div>
    </section>
  );
}
