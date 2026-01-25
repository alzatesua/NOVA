// src/hooks/useAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const navigate = useNavigate();
  const rol          = localStorage.getItem('rol');
  const token        = localStorage.getItem('accessToken');
  const usuario      = localStorage.getItem('usuario');
  const tokenUsuario = localStorage.getItem("token_usuario");
  const accessToken  = localStorage.getItem("accessToken");
  const nombre       = localStorage.getItem("usuario");
  const nombreTienda = localStorage.getItem("tienda");
  const hostname     = window.location.hostname;
  const tienda       = localStorage.getItem('tienda');
  const subdominio   = window.location.hostname.split('.')[0];



  useEffect(() => {
    if (!rol || !token) {
      localStorage.clear();
      navigate('/login');
    }
  }, [rol, token, usuario, tokenUsuario, accessToken, nombre, nombreTienda, hostname, tienda, subdominio, navigate]);

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return { rol, token, usuario, tokenUsuario, accessToken, nombre, nombreTienda, hostname, tienda, subdominio, logout };
}
