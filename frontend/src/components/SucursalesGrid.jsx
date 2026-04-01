import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import {
  crearBodega,
  fetchBodegas,
  crearExistencia,
  fetchProducts,
  crearTraslado,
  fetchCiudades,
  fetchPaises
} from '../services/api';
import Modal from '../components/Modal';
import SucursalesForm from '../components/SucursalesForm';
import { useFetchSucursales } from '../hooks/useFetchSucursales';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toast';

import BodegasModal from '../components/bodegas/BodegasModal';



const SECCIONES = [//secciones para el modal de bodegas
  { id: 'crear-bodega',       label: 'Crear bodega' },
  { id: 'ajustar-existencia', label: 'Ajustar existencia' },
  { id: 'realizar-traslado',  label: 'Realizar traslado' },
  { id: 'enviar-traslado',    label: 'Enviar traslado' },
  { id: 'recibir-traslado',   label: 'Recibir traslado' },
];


export default function SucursalesGrid() {

  // --- Helpers para obtener nombres de ciudad y país ---
  const getNombreCiudad = (ciudadId) => {
    if (!ciudadId) return 'No especificada';
    const ciudad = ciudades.find(c => String(c.id) === String(ciudadId));
    if (!ciudad) {
      console.log('❌ Ciudad no encontrada:', { ciudadId, ciudadesIds: ciudades.slice(0, 5).map(c => c.id) });
    }
    return ciudad?.name || ciudadId;
  };

  const getNombrePais = (paisId) => {
    if (!paisId) return 'No especificado';
    const pais = paises.find(p => String(p.id) === String(paisId));
    if (!pais) {
      console.log('❌ País no encontrado:', { paisId, paisesIds: paises.slice(0, 5).map(p => p.id) });
    }
    return pais?.name || paisId;
  };

  const [ajusteForm, setAjusteForm] = useState({
    producto: '', 
    bodega: '',   
    delta: 1      
  });


  const [trasladoForm, setTrasladoForm] = useState({ productoId: '', origenId: '', destinoId: '', cantidad: 1, observaciones: '' });
  const [enviarForm, setEnviarForm]     = useState({ trasladoId: '' });
  const [recibirForm, setRecibirForm]   = useState({ trasladoId: '' });
  const [ajusteLoading, setAjusteLoading]     = useState(false);
  const [trasladoLoading, setTrasladoLoading] = useState(false);
  const [enviarLoading, setEnviarLoading]     = useState(false);
  const [recibirLoading, setRecibirLoading]   = useState(false);



  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState('todas');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [ciudades, setCiudades] = useState([]);
  const [paises, setPaises] = useState([]);

  // --- Estados de crear bodega (con UI mejorada) ---
  const [showBodegaForm, setShowBodegaForm] = useState(false);
  const [sucursalSel, setSucursalSel] = useState(null);
  const [bodegaForm, setBodegaForm] = useState({
    nombre: '',
    tipo: 'SUC',             // según tu API
    es_predeterminada: false,
    estatus: true,
  });
  const [bodegaLoading, setBodegaLoading] = useState(false);

  const { rol, usuario, subdominio, tokenUsuario } = useAuth();
  const { sucursales, isLoading, ref: gridRef, reload } = useFetchSucursales();
  const [active, setActive] = useState(SECCIONES[0].id);
  const [newProducts, setNewProducts] = useState([]);

  // --- Cargar ciudades y países para mostrar nombres ---
  useEffect(() => {
    const cargarUbicaciones = async () => {
      try {
        const [ciudadesData, paisesData] = await Promise.all([
          fetchCiudades(tokenUsuario),
          fetchPaises(tokenUsuario)
        ]);
        const ciudadesArray = Array.isArray(ciudadesData) ? ciudadesData : [];
        const paisesArray = Array.isArray(paisesData) ? paisesData : [];
        setCiudades(ciudadesArray);
        setPaises(paisesArray);
      } catch (e) {
        console.error('Error cargando ubicaciones:', e);
      }
    };
    cargarUbicaciones();
  }, [tokenUsuario]);


  // --- Filtros ---
  const filteredSucursales = (sucursales ?? []).filter((suc) => {
    const s = searchTerm.toLowerCase();
    const searchMatch =
      suc.nombre.toLowerCase().includes(s) ||
      suc.ciudad.toLowerCase().includes(s) ||
      suc.pais.toLowerCase().includes(s);

    const estadoMatch =
      quickFilter === 'todas' ||
      (quickFilter === 'activas' && suc.activo) ||
      (quickFilter === 'inactivas' && !suc.activo);

    return searchMatch && estadoMatch;
  });

  // --- Handlers bodega ---
 function abrirNuevaBodega(suc) {
  setSucursalSel(suc);
  setShowBodegaForm(true);
}

  






  async function handleAjustarExistencia(payload /*, productoEncontrado */) {
  if (!sucursalSel?.id) return;

  const body = {
    token: tokenUsuario,
    usuario,
    subdominio,
    sucursal: Number(sucursalSel.id),
    producto: Number(payload.producto),
    bodega: Number(payload.bodega),
    delta: Number(payload.delta),
  };

  if (!body.producto) throw new Error('Producto inválido');
  if (!body.bodega) throw new Error('Bodega inválida');
  if (!body.delta || Number.isNaN(body.delta) || body.delta === 0) {
    throw new Error('Delta debe ser un número distinto de 0');
  }

  try {
    setAjusteLoading(true);
    await crearExistencia(body);
    showToast('success', 'Existencia ajustada');
  } catch (err) {
    console.error('Error al ajustar existencia:', err);
    showToast('error', err?.message || 'No se pudo ajustar la existencia');
  } finally {
    setAjusteLoading(false);
  }
}




  async function handleEnviarTraslado(e){ e.preventDefault(); setEnviarLoading(true);
    try { /* TODO */ showToast('success','Traslado enviadoo'); }
    catch(e){ showToast('error','No se pudo enviar'); }
    finally{ setEnviarLoading(false); }
  }

  async function handleRecibirTraslado(e){ e.preventDefault(); setRecibirLoading(true);
    try { /* TODO */ showToast('success','Traslado recibido'); }
    catch(e){ showToast('error','No se pudo recibir'); }
    finally{ setRecibirLoading(false); }
  }

  async function handleCrearBodega(e) {
    e.preventDefault();
    if (!sucursalSel) return;

    try {
      setBodegaLoading(true);
      await crearBodega({
        token: tokenUsuario,              
        usuario,                             
        subdominio: subdominio,  
        sucursal: sucursalSel.id,
        nombre: bodegaForm.nombre.trim(),
        tipo: bodegaForm.tipo,              
        es_predeterminada: bodegaForm.es_predeterminada,
        estatus: bodegaForm.estatus,
      });

      // éxito UI
      setShowBodegaForm(false);
      //setBodegaForm({ nombre: '', tipo: 'SUC', es_predeterminada: false, estatus: true });
      reload();
      showToast('success', 'Bodega creada con exito');
    } catch (err) {
       console.log("Error al crear bodega");
    } finally {
      setBodegaLoading(false);
    }
  }

  async function crearTrasladoCompat({
      usuario, token, subdominio,
      bodega_origen, bodega_destino,
      usar_bodega_transito, lineas
    }) {
      const resp = await fetch('api/traslados/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify({
          usuario,
          token,
          subdominio,
          bodega_origen,
          bodega_destino,
          usar_bodega_transito,
          lineas, // [{ producto, cantidad }, ...]
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw { response: { data }, message: 'Error de red/API' };
      }
      return resp.json().catch(() => ({}));
  }



  const CONSOLIDAR_DUPLICADOS = true;

  function consolidarLineasPorProducto(lineas) {
    // lineas: [{ producto, cantidad }]
    const map = new Map();
    for (const l of lineas) {
      const key = String(l.producto);
      const prev = map.get(key) || 0;
      map.set(key, prev + Number(l.cantidad));
    }
    return Array.from(map.entries()).map(([producto, cantidad]) => ({
      producto: Number(producto),
      cantidad: Number(cantidad),
    }));
  }

  async function handleRealizarTraslado(e, ctx) {
    e?.preventDefault?.();
    const { newProducts, usarTransito, close, resetLines } = ctx || {};

    const isPosInt = v => Number.isFinite(Number(v)) && Number(v) > 0;

    // --- Validaciones ---
    const errores = [];
    if (!Array.isArray(newProducts) || newProducts.length === 0) {
      errores.push('Agrega al menos un traslado.');
    } else {
      newProducts.forEach((t, i) => {
        if (!t.bodega_origen)  errores.push(`Traslado ${i + 1}: selecciona bodega de origen.`);
        if (!t.bodega_destino) errores.push(`Traslado ${i + 1}: selecciona bodega de destino.`);
        if (t.bodega_origen && t.bodega_destino && String(t.bodega_origen) === String(t.bodega_destino)) {
          errores.push(`Traslado ${i + 1}: origen y destino no pueden ser iguales.`);
        }

        if (!Array.isArray(t.lineas) || t.lineas.length === 0) {
          errores.push(`Traslado ${i + 1}: agrega al menos una línea (producto + cantidad).`);
          return;
        }

        const vistos = new Set();
        t.lineas.forEach((ln, j) => {
          if (!ln?.producto_id) errores.push(`Traslado ${i + 1} • Línea ${j + 1}: falta producto.`);
          if (!isPosInt(ln?.cantidad)) errores.push(`Traslado ${i + 1} • Línea ${j + 1}: cantidad debe ser > 0.`);
          if (ln?.producto_id) {
            const k = String(ln.producto_id);
            if (vistos.has(k)) errores.push(`Traslado ${i + 1}: producto ${ln.producto_id} repetido en líneas.`);
            else vistos.add(k);
          }
        });
      });
    }
    if (errores.length) {
      errores.forEach(m => showToast('warning', m));
      return;
    }

    // --- Agrupar por (origen, destino) ---
    const grupos = new Map(); // key: "origen|destino" -> { origen, destino, observaciones, lineas: [...] }
    for (const t of newProducts) {
      const origen  = Number(t.bodega_origen);
      const destino = Number(t.bodega_destino);
      const key = `${origen}|${destino}`;
      if (!grupos.has(key)) grupos.set(key, { origen, destino, observaciones: (t.observaciones || '').trim() || null, lineas: [] });

      // push líneas { producto, cantidad }
      t.lineas.forEach(ln => {
        grupos.get(key).lineas.push({
          producto: Number(ln.producto_id),
          cantidad: Number(ln.cantidad),
        });
      });
    }

    // --- (Opcional) Consolidar duplicados por producto dentro de cada grupo ---
    const consolidarLineasPorProducto = (lineas) => {
      const acc = new Map();
      for (const ln of lineas) {
        const k = String(ln.producto);
        acc.set(k, { producto: ln.producto, cantidad: (acc.get(k)?.cantidad || 0) + Number(ln.cantidad) });
      }
      return Array.from(acc.values());
    };
    for (const [key, grp] of grupos) {
      grupos.set(key, { ...grp, lineas: consolidarLineasPorProducto(grp.lineas) });
    }

    setTrasladoLoading(true);
    try {
      const exitos = [], fallos = [];
      for (const [, grp] of grupos) {
        const payload = {
          usuario,
          token: tokenUsuario,
          subdominio,
          bodega_origen: grp.origen,
          bodega_destino: grp.destino,
          observaciones: grp.observaciones,        // global por traslado (opcional)
          usar_bodega_transito: Boolean(usarTransito),
          lineas: grp.lineas,                      // [{producto, cantidad}]
        };
        try {
          await crearTraslado(payload);
          exitos.push(grp);
        } catch (err) {
          const mensaje = err?.response?.data?.detail || err?.response?.data?.message || err?.message ||
                          `Error al crear traslado de ${grp.origen} → ${grp.destino}`;
          fallos.push({ grp, mensaje });
        }
      }

      if (exitos.length) {
        showToast('success', `Se creó/aron ${exitos.length} traslado(s) con éxito.`);
        resetLines?.();
        close?.();
        reload?.();
      }
      if (fallos.length) {
        fallos.forEach(f => showToast('error', `${f.mensaje} (origen ${f.grp.origen} → destino ${f.grp.destino})`));
      }
    } finally {
      setTrasladoLoading(false);
    }
  }


  


  return (
    <main className="w-full p-4 sm:p-6 lg:p-8 bg-slate-50 dark:!bg-slate-950 min-h-screen transition-colors duration-200">
      <div className="w-full">
        {/* Cabecera */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
          {/* Buscador */}
          <div className="relative mx-auto w-full max-w-xs">
            <input
              type="text"
              placeholder="Buscar sucursales..."
              className="w-full border border-slate-300 dark:!border-slate-600 rounded-full pl-10 pr-4 py-2.5 text-sm dark:!bg-slate-800 dark:!text-white dark:!placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-shadow duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>

          {/* Filtros rápidos y botón nueva sucursal
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {['Todas', 'Activas', 'Inactivas'].map((label) => (
                <button
                  key={label}
                  onClick={() => setQuickFilter(label.toLowerCase())}
                  className={`px-3 py-1.5 rounded-full text-sm transition duration-300 transform ${
                    quickFilter === label.toLowerCase()
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white dark:!bg-slate-800 text-slate-700 dark:!text-slate-300 border border-slate-300 dark:!border-slate-600 hover:bg-slate-100 dark:hover:!bg-slate-700 hover:scale-105'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreateForm((f) => !f)}
              className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              {showCreateForm ? 'Cancelar' : 'Nueva Sucursal'}
            </button>
          </div>*/}

          {/* Modal crear sucursal */}
          {showCreateForm && (
            <Modal onClose={() => setShowCreateForm(false)}>
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 dark:!text-white">
                Crea tu nueva sucursal
              </h4>
              <SucursalesForm
                onCreated={() => {
                  reload();
                  setShowCreateForm(false);
                }}
              />
            </Modal>
          )}
        </div>

        {/* Lista de sucursales */}
        {isLoading ? (
          <p className="text-center py-8 text-slate-600 dark:!text-slate-400">Cargando sucursales…</p>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {filteredSucursales.map((suc) => (
              <div
                key={suc.id}
                className="bg-white dark:!bg-slate-900 rounded-xl shadow p-5 flex flex-col h-full cursor-pointer hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out border border-slate-200 dark:!border-slate-700 hover:border-blue-400 dark:hover:!border-blue-500 ring-1 ring-slate-200 dark:!ring-slate-700 group"
              >
                {/* Header de la tarjeta */}
                <div className="mb-4 pb-3 border-b border-slate-200 dark:!border-slate-700 text-center">
                  <h5 className="text-lg font-semibold text-gray-900 dark:!text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">{suc.nombre}</h5>
                </div>

                {/* Datos */}
                <dl className="flex-grow grid grid-cols-1 gap-y-2 group/dl">
                  {[
                    ['Dirección', suc.direccion],
                    ['Ciudad', getNombreCiudad(suc.ciudad)],
                    ['País', getNombrePais(suc.pais)],
                  ].map(([dt, dd]) => (
                    <div key={dt} className="flex justify-between group-hover/dl:translate-x-1 transition-transform duration-300">
                      <dt className="text-xs font-medium text-slate-600 dark:!text-slate-400">{dt}</dt>
                      <dd className="text-xs text-slate-900 dark:!text-slate-200 text-right">{dd}</dd>
                    </div>
                  ))}
                </dl>

                {/* Botón de bodegas en la parte inferior */}
                <div className="mt-4 pt-3 border-t border-slate-200 dark:!border-slate-700 flex justify-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirNuevaBodega(suc);
                    }}
                    title={`Bodegas de ${suc.nombre}`}
                    className="
                      inline-flex items-center gap-1
                      bg-amber-50 dark:!bg-amber-900/50 text-amber-800 dark:!text-amber-200
                      text-xs font-medium
                      px-2.5 py-1 rounded-full
                      border border-amber-200 dark:!border-amber-500
                      hover:bg-amber-100 dark:hover:bg-amber-900/70
                      group-hover:scale-110 group-hover:bg-amber-100 dark:group-hover:!bg-amber-800/70
                      focus:outline-none focus:ring-2 focus:ring-amber-400 dark:!focus:ring-amber-500 focus:ring-offset-1
                      transition-all duration-300
                      whitespace-nowrap
                    "
                  >
                    <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                    <span>Bodegas</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Modal crear bodega */}
      <BodegasModal
        isOpen={showBodegaForm}
        onClose={() => setShowBodegaForm(false)}
        sucursalSel={sucursalSel}

        bodegaForm={bodegaForm}
        setBodegaForm={setBodegaForm}
        bodegaLoading={bodegaLoading}
        onCrearBodega={handleCrearBodega}

        ajusteForm={ajusteForm}
        setAjusteForm={setAjusteForm}
        ajusteLoading={ajusteLoading}
        onAjustar={handleAjustarExistencia}

        trasladoForm={trasladoForm}
        setTrasladoForm={setTrasladoForm}
        trasladoLoading={trasladoLoading}
        onRealizarTraslado={handleRealizarTraslado}

        enviarForm={enviarForm}
        setEnviarForm={setEnviarForm}
        enviarLoading={enviarLoading}
        onEnviarTraslado={handleEnviarTraslado}

        recibirForm={recibirForm}
        setRecibirForm={setRecibirForm}
        recibirLoading={recibirLoading}
        onRecibirTraslado={handleRecibirTraslado}
      />

      </div>
    </main>
  );
}
