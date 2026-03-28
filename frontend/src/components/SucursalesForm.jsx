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
    <div className="bg-white dark:!bg-slate-900 p-8 rounded-xl shadow-lg max-w-4xl mx-auto w-full">
      <h4 className="text-2xl font-semibold mb-6 text-gray-900 dark:!text-white">Nueva Sucursal</h4>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* País */}
        <div className="flex flex-col">
          <label htmlFor="pais" className="mb-2 text-sm font-medium text-gray-700 dark:!text-slate-300 select-none">País</label>
          <select
            id="pais"
            name="pais"
            value={selectedPais}
            onChange={e => setSelectedPais(e.target.value)}
            disabled={loading || isLoadingPaises}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:!border-slate-600 bg-gray-50 dark:!bg-slate-800 dark:!text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 hover:border-blue-400"
          >
            <option value="" disabled className="dark:!bg-slate-800">
              {isLoadingPaises ? 'Cargando países...' : 'Seleccione un país'}
            </option>
            {paises.map(pais => (
              <option key={pais.id} value={pais.id} className="dark:!bg-slate-800">
                {pais.name}
              </option>
            ))}
          </select>
        </div>

        {/* Ciudad */}
        <div className="flex flex-col">
          <label htmlFor="ciudad" className="mb-2 text-sm font-medium text-gray-700 dark:!text-slate-300 select-none">Ciudad</label>
          <select
            id="ciudad"
            name="ciudad"
            value={selectedCiudad}
            onChange={e => setSelectedCiudad(e.target.value)}
            disabled={loading || isLoadingCiudades || !selectedPais}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:!border-slate-600 bg-gray-50 dark:!bg-slate-800 dark:!text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 hover:border-blue-400"
          >
            <option value="" disabled className="dark:!bg-slate-800">
              {isLoadingCiudades ? 'Cargando ciudades...' : 'Seleccione una ciudad'}
            </option>
            {ciudades.map(ciudad => (
              <option key={ciudad.id} value={ciudad.id} className="dark:!bg-slate-800">
                {ciudad.name}
              </option>
            ))}
          </select>
        </div>

        {/* Municipio / Región */}
        <div className="flex flex-col">
          <label htmlFor="region" className="mb-2 text-sm font-medium text-gray-700 dark:!text-slate-300 select-none">Municipio</label>
          <select
            id="region"
            name="region"
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            disabled={loading || isLoadingRegiones || !selectedCiudad}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:!border-slate-600 bg-gray-50 dark:!bg-slate-800 dark:!text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 hover:border-blue-400"
          >
            <option value="" disabled className="dark:!bg-slate-800">
              {isLoadingRegiones ? 'Cargando municipios...' : 'Seleccione un municipio'}
            </option>
            {regiones.map(region => (
              <option key={region.id} value={region.id} className="dark:!bg-slate-800">
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nombre */}
        <div className="flex flex-col">
          <label htmlFor="nombre" className="mb-2 text-sm font-medium text-gray-700 dark:!text-slate-300 select-none">Nombre</label>
          <input
            id="nombre"
            name="nombre"
            required
            placeholder="Nombre de la sucursal"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:!border-slate-600 bg-gray-50 dark:!bg-slate-800 dark:!text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 placeholder-gray-400 dark:!placeholder-slate-400 hover:border-blue-400"
          />
        </div>

        {/* Dirección */}
        <div className="flex flex-col md:col-span-2 lg:col-span-2">
          <label htmlFor="direccion" className="mb-2 text-sm font-medium text-gray-700 dark:!text-slate-300 select-none">Dirección</label>
          <input
            id="direccion"
            name="direccion"
            required
            placeholder="Dirección completa"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:!border-slate-600 bg-gray-50 dark:!bg-slate-800 dark:!text-white
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 placeholder-gray-400 dark:!placeholder-slate-400 hover:border-blue-400"
          />
        </div>

        {/* Botón */}
        <div className="md:col-span-2 lg:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center
              px-7 py-3 bg-blue-600 text-white dark:text-blue-100 font-semibold rounded-lg shadow-md
              hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
              transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                Enviando…
              </>
            ) : (
              'Crear Sucursal'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
