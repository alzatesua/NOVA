// src/hooks/useSessionExpired.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export function useSessionExpired() {
  const navigate = useNavigate();

  useEffect(() => {
    // Escuchar eventos de sesión expirada
    const handleSessionExpired = () => {
      // Limpiar todos los tokens
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_usuario');
      localStorage.removeItem('token_usuario');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refresh_token');

      // Mostrar notificación al usuario
      toast.error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });

      // Redirigir al login
      navigate('/login');
    };

    // Escuchar evento personalizado de sesión expirada
    window.addEventListener('session:expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session:expired', handleSessionExpired);
    };
  }, [navigate]);
}
