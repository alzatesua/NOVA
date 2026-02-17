import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login/login';
import Dashboard from './dashboard/Dashboard';
import CrearTienda from "./tiendas/crear";

// Importar el componente de tienda que ya existe
import TiendaPage from "./tienda/TiendaPage";

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