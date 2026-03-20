import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login/login';
import Dashboard from './dashboard/Dashboard';
import CrearTienda from "./tiendas/crear";

// Importar el componente de tienda que ya existe
import TiendaPage from "./tienda/TiendaPage";

// Importar servicio de refresh proactivo
import { startAutoRefresh, stopAutoRefresh } from './services/tokenRefresh';

//estilos de notificacion
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente wrapper para verificar autenticación
function RequireAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setIsChecked(true);
  }, []);

  if (!isChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Componente wrapper para redirección según autenticación
function HomeRedirect() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsAuthenticated(!!token);
    setIsChecked(true);
  }, []);

  if (!isChecked) {
    return null;
  }

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticación inicial
    const token = localStorage.getItem("accessToken") ||
                  localStorage.getItem("auth_access_token") ||
                  localStorage.getItem("token_usuario");
    setIsAuthenticated(!!token);

    // Iniciar refresh proactivo si hay token
    if (token) {
      startAutoRefresh();
    }

    // Escuchar cambios en localStorage (para detectar logout/login)
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'auth_access_token' || e.key === 'token_usuario') {
        const newToken = localStorage.getItem("accessToken") ||
                        localStorage.getItem("auth_access_token") ||
                        localStorage.getItem("token_usuario");
        const wasAuthenticated = isAuthenticated;
        const nowAuthenticated = !!newToken;

        setIsAuthenticated(nowAuthenticated);

        // Si el usuario acaba de iniciar sesión
        if (!wasAuthenticated && nowAuthenticated) {
          startAutoRefresh();
        }
        // Si el usuario acabó de cerrar sesión
        else if (wasAuthenticated && !nowAuthenticated) {
          stopAutoRefresh();
        }
      }
    };

    // También escuchar eventos personalizados de logout
    const handleLogout = () => {
      stopAutoRefresh();
      setIsAuthenticated(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('logout', handleLogout);

    // Cleanup
    return () => {
      stopAutoRefresh();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('logout', handleLogout);
    };
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        style={{ zIndex: 10000 }}
      />
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/tienda" element={<TiendaPage />} />
        <Route path="/shop" element={<TiendaPage />} />
        <Route path="/catalogo" element={<TiendaPage />} />
        <Route path="/productos" element={<TiendaPage />} />

        <Route path="/login" element={<Login />} />
        <Route path="/registro/tienda" element={<CrearTienda />} />

        {/* Ruta raíz */}
        <Route path="/" element={<HomeRedirect />} />

        {/* RUTAS PROTEGIDAS */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;