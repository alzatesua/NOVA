// src/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import UsersView from '../components/UsersView';
import ProductosView from '../components/ProductosView';
import FacturacionView from '../components/FacturacionView';
import NoticiasView from '../components/NoticiasView';
import DashboardView from '../components/DashboardView';
import SucursalesGrid from '../components/SucursalesGrid';
import ConfiguracionView from '../components/ConfiguracionView';
import ClientesView from '../components/ClientesView';
import CajaView from '../components/CajaView';
import MoraView from '../components/MoraView';
import { useFetchUsers } from '../hooks/useFetchUsers';
import { useFetchSucursales } from '../hooks/useFetchSucursales';
import { useAuth } from '../hooks/useAuth';
import { fetchProducts } from '../services/api';


export default function Dashboard() {
  const { rol, usuario, logout, tokenUsuario, subdominio } = useAuth();

  // Usuarios y sucursales existentes
  const { users: usersData, refetchRef: usersRefetchRef } = useFetchUsers();
  const [users, setUsers] = useState(usersData);
  const { sucursales, isLoading: loadingSuc, ref: gridRef } = useFetchSucursales();

  // Sincronizar users cuando cambie usersData
  useEffect(() => {
    if (usersData && Array.isArray(usersData.datos)) {
      setUsers(usersData.datos);
    }
  }, [usersData]);

  // Función para recargar usuarios después de crear uno nuevo
  const reloadUsers = () => {
    usersRefetchRef.current?.();
  };

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

  // Vista inicial: intentar restaurar desde localStorage, si no existe usar valor por defecto
  const getInitialView = () => {
    const savedView = localStorage.getItem('currentView');
    if (savedView) return savedView;
    return rol === 'admin' ? 'dashboard' : 'entrada';
  };

  const [view, setView] = useState(getInitialView());

  // Guardar vista actual en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  

  return (
    <div className="min-h-screen bg-slate-50 dark:!bg-slate-950 transition-colors duration-200 flex flex-col">
      <Navbar
        rol={rol}
        onViewChange={setView}
        onLogout={logout}
        currentView={view}
      />

      <main className="pt-16 flex-grow flex flex-col items-center px-4 pb-10 w-full">
        {/* VISTA DE DASHBOARD - Nuevas gráficas y métricas */}
        {view === 'dashboard' && (
          <div className="relative w-full max-w-7xl">
            <DashboardView />
          </div>
        )}

        {view === 'usuarios' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200">
            <section className="w-full">
              <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">Gestión de Usuarios</h3>
              <UsersView users={usersData} onCreated={reloadUsers} />
            </section>
          </div>
        )}

        {view === 'sucursales' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200">
            <SucursalesGrid
              sucursales={sucursales}
              isLoading={loadingSuc}
              refetchRef={gridRef}
            />
          </div>
        )}

        {view === 'productos' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200">
            <ProductosView
              products={products}
              loading={loadingProducts}
              onCreated={reloadProducts}
            />
          </div>
        )}

        {/* VISTA DE NOTICIAS - Carrusel + link del catálogo */}
        {/*{view === 'noticias' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200">
            <NoticiasView />
          </div>
        )}*/}

        {/* VISTA DE FACTURACIÓN - SIN PROPS, USA DATOS INTERNOS */}
        {view === 'facturacion' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200">
            <FacturacionView />
          </div>
        )}

        {/* VISTA DE CONFIGURACIÓN - SIN PROPS, USA DATOS INTERNOS */}
        {view === 'configuracion' && <ConfiguracionView />}

        {/* VISTA DE GESTIÓN DE CLIENTES - CUPONES Y CLIENTES */}
        {view === 'clientes' && (
          <div className="relative w-full mb-8 p-8 rounded-3xl
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200">
            <ClientesView />
          </div>
        )}

        {/* VISTA DE CAJA - CONTROL DE CAJA */}
        {view === 'caja' && (
          <div className="relative w-full mb-8">
            <CajaView />
          </div>
        )}

        {/* VISTA DE GESTIÓN DE MORA */}
        {view === 'mora' && (
          <div className="relative w-full mb-8">
            <MoraView />
          </div>
        )}

      </main>
    </div>
  );
}