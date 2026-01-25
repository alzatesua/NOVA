import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login/login';

// Importa el Dashboard que creamos antes
import Dashboard from './dashboard/Dashboard';

import CrearTienda from "./tiendas/crear";

//estilos de notificacion
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente para rutas privadas
function PrivateRoute({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    // No autenticado → redirige a login
    return <Navigate to="/login" replace />;
  }

  // Si autenticado, renderiza los hijos
  return children;
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
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro/tienda" element={<CrearTienda />} />


        {/* Ruta protegida para dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Ruta por defecto (opcional), redirigir a login */}
        <Route 
          path="*" 
          element={<Navigate to="/login" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
