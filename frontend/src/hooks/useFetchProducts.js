
// src/hooks/useFetchProducts.js
/*
import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '../services/api'; // Asegúrate de implementar esta función
import { useAuth } from './useAuth';

export function useFetchProducts() {
  const { usuario, tokenUsuario, subdominio, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { datos } = await fetchProducts({ usuario, tokenUsuario, subdominio });
      setProducts(datos || []);
    } catch (err) {
      if (err.isNotFound) logout();
    } finally {
      setIsLoading(false);
    }
  }, [usuario, tokenUsuario, subdominio, logout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    products,
    isLoading,
    reload: fetchData
  };
}
*/