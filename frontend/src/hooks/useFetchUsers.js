import { useState, useEffect, useRef } from 'react';
import { fetchUsers } from '../services/api';
import { useAuth } from './useAuth';

export function useFetchUsers() {
  const auth = useAuth();
  const [users, setUsers] = useState([]);

  // Usar ref para evitar dependencias infinitas
  const refetchRef = useRef(() => {});

  refetchRef.current = async () => {
    try {
      const data = await fetchUsers(auth);
      console.log("Recargando usuarios - respuesta completa:", JSON.stringify(data, null, 2));
      console.log("¿Es array datos?", Array.isArray(data?.datos));
      console.log("datos:", data?.datos);
      setUsers(Array.isArray(data.datos) ? data.datos : []);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      if (err.isNotFound) auth.logout();
    }
  };

  useEffect(() => {
    refetchRef.current();
  }, []);

  return { users, refetchRef };
}
