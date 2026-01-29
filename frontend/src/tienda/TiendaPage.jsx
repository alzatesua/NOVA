import React from 'react';
import EcommerceView from '../components/EcommerceView';

/**
 * Página independiente para la tienda e-commerce
 * Accesible en: /tienda
 *
 * Esta página puede ser accedida públicamente sin necesidad de login
 * El subdominio se extrae automáticamente del hostname
 */
export default function TiendaPage() {
  // Extraer el subdominio del hostname actual
  // Ejemplo: dagi-4a4487.dagi.co -> dagi-4a4487
  const extractSubdomain = (hostname) => {
    const parts = hostname.split('.');
    // Si hay al menos 2 partes y la primera no es 'www'
    if (parts.length >= 2 && parts[0] !== 'www') {
      return parts[0];
    }
    return null;
  };

  const hostnameSubdomain = extractSubdomain(window.location.hostname);

  // Verificar que se pudo extraer el subdominio del hostname
  if (!hostnameSubdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Tienda no encontrada</h1>
          <p className="text-gray-600">No se pudo determinar el subdominio de la tienda.</p>
        </div>
      </div>
    );
  }

  // Renderizar la tienda e-commerce
  return <EcommerceView />;
}
