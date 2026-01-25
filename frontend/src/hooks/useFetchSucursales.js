import { useState, useCallback, useEffect, useRef } from 'react';
import { useInView }          from 'react-intersection-observer';
import { fetchSucursales }    from '../services/api';
import { useAuth }            from './useAuth';

export function useFetchSucursales({ minInterval = 5000 } = {}) {
  const { rol, usuario, tokenUsuario, subdominio, logout } = useAuth();
  const [sucursales, setSucursales] = useState([]);
  const [isLoading, setIsLoading]   = useState(false);

  // Ref para la última vez que hicimos fetch:
  const lastFetchRef = useRef(0);

  const load = useCallback(async () => {
    if (rol !== 'admin') return;
    setIsLoading(true);
    try {
      const { datos } = await fetchSucursales({ usuario, tokenUsuario, subdominio });
      setSucursales(datos || []);
    } catch (err) {
      if (err.isNotFound) logout();
    } finally {
      setIsLoading(false);
    }
  }, [rol, usuario, tokenUsuario, subdominio, logout]);

  const { ref, inView } = useInView({
    threshold:   0.3,
    triggerOnce: false,   // queremos reintentar si sale y vuelve a entrar
  });

  useEffect(() => {
    if (!inView) return;

    const now = Date.now();
    // Si ha pasado al menos minInterval ms desde el último fetch, lo hacemos:
    if (now - lastFetchRef.current >= minInterval) {
      lastFetchRef.current = now;
      load();
    }
  }, [inView, load, minInterval]);

  return { sucursales, isLoading, ref, reload: load };
}
