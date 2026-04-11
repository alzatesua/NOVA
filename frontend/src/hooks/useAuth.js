// src/hooks/useAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();
  const rol = localStorage.getItem('rol');
  const tokenUsuario = localStorage.getItem('token_usuario');
  const accessToken = localStorage.getItem('auth_access_token') || localStorage.getItem('accessToken');
  const usuario = localStorage.getItem('auth_usuario') || localStorage.getItem('usuario');
  const tienda = localStorage.getItem('tienda');
  const subdominio = window.location.hostname.split('.')[0];
  const idSucursal = localStorage.getItem('id_sucursal');

  useEffect(() => {
    // Verificar autenticación - usar token_usuario como principal
    const tokenToUse = tokenUsuario || accessToken;
    if (!rol || !tokenToUse) {
      // Limpiar solo claves de autenticación, preservar perfil
      limpiarAuth();
      navigate('/login');
    }
  }, [rol, tokenUsuario, accessToken, navigate]);

  const limpiarAuth = () => {
    // Claves de autenticación que deben limpiarse
    const clavesAuth = [
      'rol',
      'token_usuario',
      'auth_access_token',
      'accessToken',
      'auth_usuario',
      'usuario',
      'tienda',
      'id_sucursal',
      'auth_refresh_token',
      'refreshToken'
    ];

    clavesAuth.forEach(clave => localStorage.removeItem(clave));
  };

  const logout = () => {
    // Limpiar solo autenticación, preservar perfil del usuario
    limpiarAuth();
    navigate('/login');
  };

  return {
    rol,
    token: tokenUsuario || accessToken,        // usar token_usuario como principal
    accessToken: tokenUsuario || accessToken,  // para backwards compatibility
    tokenUsuario,
    usuario,
    tienda,
    subdominio,
    idSucursal: idSucursal ? parseInt(idSucursal) : null,
    isAdmin: rol === 'admin',
    logout,
  };
}
