// src/hooks/useAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();
  const rol = localStorage.getItem('rol');
  const tokenUsuario = localStorage.getItem('token_usuario');
  const accessToken = localStorage.getItem('accessToken');
  const usuario = localStorage.getItem('usuario');
  const tienda = localStorage.getItem('tienda');
  const subdominio = window.location.hostname.split('.')[0];
  const idSucursal = localStorage.getItem('id_sucursal');

  useEffect(() => {
    // Verificar autenticación
    if (!rol || !accessToken) {
      localStorage.clear();
      navigate('/login');
    }
  }, [rol, accessToken, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return {
    rol,
    token: accessToken,        // para backwards compatibility
    accessToken,
    tokenUsuario,
    usuario,
    tienda,
    subdominio,
    idSucursal: idSucursal ? parseInt(idSucursal) : null,
    isAdmin: rol === 'admin',
    logout,
  };
}
