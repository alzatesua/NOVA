// src/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UsersView from '../components/UsersView';
import ProductosView from '../components/ProductosView';
import FacturacionView from '../components/FacturacionView';
import ReportesView from '../components/ReportesView';
import SucursalesGrid from '../components/SucursalesGrid';
import { useFetchUsers } from '../hooks/useFetchUsers';
import { useFetchSucursales } from '../hooks/useFetchSucursales';
import { useAuth } from '../hooks/useAuth';
import { fetchProducts } from '../services/api';
import { showToast } from '../utils/toast';
import DashboardCarousel from '../components/DashboardCarousel';


export default function Dashboard() {
  const { rol, usuario, tienda, logout, tokenUsuario, subdominio } = useAuth();

  // Usuarios y sucursales existentes
  const users = useFetchUsers();
  const { sucursales, isLoading: loadingSuc, ref: gridRef, reload: reloadSuc } = useFetchSucursales();

  // 1) Estado para productos
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // 2) Función para (re) cargar productos
  const reloadProducts = async () => {
    setLoadingProducts(true);
    try {
      const { datos } = await fetchProducts({ usuario, tokenUsuario, subdominio });
      setProducts(datos || []);
    } catch (err) {
      if (err.isNotFound) logout();
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 3) Cargar la primera vez
  useEffect(() => {
    reloadProducts();
  }, []);

  const [view, setView] = useState(rol === 'admin' ? 'dashboard' : 'entrada');

  

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar
        rol={rol}
        onViewChange={setView}
        onLogout={logout}
        currentView={view}
      />

      <main className="pt-16 flex-grow flex flex-col items-center px-4 pb-10 w-full">
        {/* Vistas */}
        {view === 'dashboard' && (
          <>
            <DashboardCarousel />
            <div className="max-w-screen-xl mx-auto mt-6 px-6 py-4 bg-white rounded-lg shadow-md flex items-center justify-between space-x-6">
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
          </>
        )}

        {view === 'usuarios' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl 
            bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
            <section className="w-full max-w-4xl">
              <h3 className="text-2xl font-bold mb-4">Gestión de Usuarios</h3>
              <UsersView users={users} />
            </section>
          </div>
        )}

        {view === 'sucursales' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl 
            bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
            <SucursalesGrid
              sucursales={sucursales}
              isLoading={loadingSuc}
              refetchRef={gridRef}
            />
          </div>
        )}

        {view === 'productos' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl 
            bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
            <ProductosView
              products={products}
              loading={loadingProducts}
              onCreated={reloadProducts}
            />
          </div>
        )}

        {/* VISTA DE REPORTES - SIN PROPS, USA DATOS INTERNOS */}
        {view === 'reportes' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl 
            bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
            <ReportesView />
          </div>
        )}

        {/* VISTA DE FACTURACIÓN - SIN PROPS, USA DATOS INTERNOS */}
        {view === 'facturacion' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl 
            bg-white/20 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
            <FacturacionView />
          </div>
        )}

      </main>
    </div>
  );
}