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
import ProveedoresView from '../components/ProveedoresView';
import NovaFooter from '../components/Footer/NovaFooter';
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

  // Estado para controlar si el menú móvil está abierto
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main
        className="flex-grow flex flex-col pb-10 w-full transition-all duration-300 overflow-x-hidden"
        style={{
          paddingTop: mobileMenuOpen ? 'calc(68px + 300px)' : '88px',
          paddingLeft: 'clamp(12px, 2vw, 24px)',
          paddingRight: 'clamp(12px, 2vw, 24px)',
          maxWidth: '100vw',
          overflowX: 'hidden'
        }}
      >
        {/* VISTA DE DASHBOARD - Nuevas gráficas y métricas */}
        {view === 'dashboard' && (
          <div className="relative w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
            <DashboardView />
          </div>
        )}

        {view === 'usuarios' && (
          <div className="relative w-full mb-8 rounded-3xl overflow-hidden
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200"
            style={{ padding: 'clamp(12px, 3vw, 32px)', maxWidth: '100%', overflowX: 'hidden' }}>
            <UsersView users={usersData} onCreated={reloadUsers} />
          </div>
        )}

        {view === 'sucursales' && (
          <div className="relative w-full mb-8 rounded-3xl overflow-hidden
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200"
            style={{ padding: 'clamp(12px, 3vw, 32px)', maxWidth: '100%', overflowX: 'hidden' }}>
            <SucursalesGrid
              sucursales={sucursales}
              isLoading={loadingSuc}
              refetchRef={gridRef}
            />
          </div>
        )}

        {view === 'productos' && (
          <div className="relative w-full mb-8 rounded-3xl overflow-hidden
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200"
            style={{ padding: 'clamp(12px, 3vw, 32px)', maxWidth: '100%', overflowX: 'hidden' }}>
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
          <div className="relative w-full mb-8 rounded-3xl overflow-hidden
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200"
            style={{ padding: 'clamp(12px, 3vw, 32px)', maxWidth: '100%', overflowX: 'hidden' }}>
            <FacturacionView />
          </div>
        )}

        {/* VISTA DE CONFIGURACIÓN - SIN PROPS, USA DATOS INTERNOS */}
        {view === 'configuracion' && <ConfiguracionView />}

        {/* VISTA DE GESTIÓN DE CLIENTES - CUPONES Y CLIENTES */}
        {view === 'clientes' && (
          <div className="relative w-full mb-8 rounded-3xl overflow-hidden
            bg-white dark:!bg-slate-900 backdrop-blur-md ring-1 ring-slate-200 dark:!ring-slate-800 shadow-lg transition-colors duration-200"
            style={{ padding: 'clamp(12px, 3vw, 32px)', maxWidth: '100%', overflowX: 'hidden' }}>
            <ClientesView />
          </div>
        )}

        {/* VISTA DE CAJA - CONTROL DE CAJA */}
        {view === 'caja' && (
          <div className="relative w-full mb-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <CajaView />
          </div>
        )}

        {/* VISTA DE GESTIÓN DE MORA */}
        {view === 'mora' && (
          <div className="relative w-full mb-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <MoraView />
          </div>
        )}

        {/* VISTA DE GESTIÓN DE PROVEEDORES */}
        {view === 'proveedores' && (
          <div className="relative w-full mb-8" style={{ maxWidth: '100%', overflowX: 'hidden' }}>
            <ProveedoresView />
          </div>
        )}

      </main>

      {/* Footer DAGI */}
      <NovaFooter />
    </div>
  );
}