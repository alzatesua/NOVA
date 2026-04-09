import React, { useState, useEffect } from 'react';
import { createSucursal, fetchCiudades, fetchPaises, fetchRegiones } from '../services/api'; 
import { showToast } from '../utils/toast';

export default function SucursalesForm({ onCreated }) {
  const [loading, setLoading] = useState(false);

  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [regiones, setRegiones] = useState([]);

  const [isLoadingPaises, setIsLoadingPaises] = useState(false);
  const [isLoadingCiudades, setIsLoadingCiudades] = useState(false);
  const [isLoadingRegiones, setIsLoadingRegiones] = useState(false);

  const [selectedPais, setSelectedPais] = useState('');
  const [selectedCiudad, setSelectedCiudad] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');

  const tokenUsuario = localStorage.getItem('token_usuario');

  // Cargar países al montar el componente
  useEffect(() => {
    const cargarPaises = async () => {
      setIsLoadingPaises(true);
      try {
        const response = await fetchPaises(tokenUsuario);
        setPaises(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error cargando países:', error);
        setPaises([]);
      } finally {
        setIsLoadingPaises(false);
      }
    };
    cargarPaises();
  }, [tokenUsuario]);

  // Cuando cambia país, cargar ciudades y limpiar selecciones
  useEffect(() => {
    if (!selectedPais) {
      setCiudades([]);
      setSelectedCiudad('');
      setRegiones([]);
      setSelectedRegion('');
      return;
    }

    const cargarCiudadesPorPais = async () => {
      setIsLoadingCiudades(true);
      try {
        const response = await fetchCiudades(tokenUsuario);
        const datosCiudades = Array.isArray(response) ? response : [];
        // Filtra ciudades por país seleccionado
        const filtradas = datosCiudades.filter(ciudad => String(ciudad.country) === String(selectedPais));
        setCiudades(filtradas);
      } catch (error) {
        console.error('Error cargando ciudades:', error);
        setCiudades([]);
      } finally {
        setIsLoadingCiudades(false);
      }
    };

    cargarCiudadesPorPais();
    setSelectedCiudad('');
    setRegiones([]);
    setSelectedRegion('');
  }, [selectedPais, tokenUsuario]);

  // Cuando cambia ciudad, cargar regiones y limpiar selección región
  useEffect(() => {
    if (!selectedCiudad) {
      setRegiones([]);
      setSelectedRegion('');
      return;
    }

    const cargarRegionesPorCiudad = async () => {
      setIsLoadingRegiones(true);
      try {
        const response = await fetchRegiones(tokenUsuario, selectedCiudad);
        setRegiones(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Error cargando regiones:', error);
        setRegiones([]);
      } finally {
        setIsLoadingRegiones(false);
      }
    };

    cargarRegionesPorCiudad();
    setSelectedRegion('');
  }, [selectedCiudad, tokenUsuario]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    const nombre = e.target.elements['nombre'].value;
    const direccion = e.target.elements['direccion'].value;

    try {
      await createSucursal({
        usuario: localStorage.getItem('usuario'),
        token: tokenUsuario,
        subdominio: window.location.hostname.split('.')[0],
        sucursal: {
          nombre,
          direccion,
          pais: selectedPais,
          ciudad: selectedCiudad,
          region: selectedRegion,
          estatus: true,
        },
      });
      showToast('success');
      e.target.reset();
      setSelectedPais('');
      setSelectedCiudad('');
      setSelectedRegion('');
      onCreated();
    } catch (err) {
      showToast('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h4 className="text-xl sm:text-2xl font-bold text-white">Nueva Sucursal</h4>
        <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Completa los datos de la sucursal</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">

        {/* País */}
        <div className="flex flex-col">
          <label htmlFor="pais" className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-medium text-slate-300 select-none">País *</label>
          <select
            id="pais"
            name="pais"
            value={selectedPais}
            onChange={e => setSelectedPais(e.target.value)}
            disabled={loading || isLoadingPaises}
            required
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-[10px] sm:text-xs transition duration-300"
            style={{
              border: '1px solid',
              borderColor: '#1a1d3d',
              backgroundColor: '#0f1229',
              color: '#ffffff'
            }}
          >
            <option value="" disabled>
              {isLoadingPaises ? 'Cargando...' : 'Seleccione país'}
            </option>
            {paises.map(pais => (
              <option key={pais.id} value={pais.id}>
                {pais.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad */}
        <div className="flex flex-col">
          <label htmlFor="ciudad" className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-medium text-slate-300 select-none">Ciudad *</label>
          <select
            id="ciudad"
            name="ciudad"
            value={selectedCiudad}
            onChange={e => setSelectedCiudad(e.target.value)}
            disabled={loading || isLoadingCiudades || !selectedPais}
            required
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-[10px] sm:text-xs transition duration-300"
            style={{
              border: '1px solid',
              borderColor: '#1a1d3d',
              backgroundColor: '#0f1229',
              color: '#ffffff'
            }}
          >
            <option value="" disabled>
              {isLoadingCiudades ? 'Cargando...' : 'Seleccione ciudad'}
            </option>
            {ciudades.map(ciudad => (
              <option key={ciudad.id} value={ciudad.id}>
                {ciudad.name}
              </option>
            ))}
          </select>
        </div>

        {/* Municipio / Región */}
        <div className="flex flex-col">
          <label htmlFor="region" className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-medium text-slate-300 select-none">Municipio *</label>
          <select
            id="region"
            name="region"
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            disabled={loading || isLoadingRegiones || !selectedCiudad}
            required
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-[10px] sm:text-xs transition duration-300"
            style={{
              border: '1px solid',
              borderColor: '#1a1d3d',
              backgroundColor: '#0f1229',
              color: '#ffffff'
            }}
          >
            <option value="" disabled>
              {isLoadingRegiones ? 'Cargando...' : 'Seleccione municipio'}
            </option>
            {regiones.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre */}
        <div className="flex flex-col">
          <label htmlFor="nombre" className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-medium text-slate-300 select-none">Nombre *</label>
          <input
            id="nombre"
            name="nombre"
            required
            placeholder="Nombre de la sucursal"
            disabled={loading}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-[10px] sm:text-xs transition duration-300"
            style={{
              border: '1px solid',
              borderColor: '#1a1d3d',
              backgroundColor: '#0f1229',
              color: '#ffffff'
            }}
          />
        </div>

        {/* Dirección */}
        <div className="flex flex-col sm:col-span-2 lg:col-span-2">
          <label htmlFor="direccion" className="mb-1.5 sm:mb-2 text-[10px] sm:text-xs font-medium text-slate-300 select-none">Dirección *</label>
          <input
            id="direccion"
            name="direccion"
            required
            placeholder="Dirección completa"
            disabled={loading}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border text-[10px] sm:text-xs transition duration-300"
            style={{
              border: '1px solid',
              borderColor: '#1a1d3d',
              backgroundColor: '#0f1229',
              color: '#ffffff'
            }}
          />
        </div>

        {/* Botón */}
        <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 lg:px-7 py-2 sm:py-3 bg-gradient-to-r from-[rgb(37,99,235)] to-[rgb(29,78,216)] text-white text-[10px] sm:text-xs font-semibold rounded-lg shadow-md hover:from-[rgb(29,78,216)] hover:to-[rgb(30,64,175)] focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Crear Sucursal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
