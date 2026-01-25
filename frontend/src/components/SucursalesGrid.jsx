import React, { useState, useEffect } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';
import {
  fetchUsers,
  crearBodega,
  fetchBodegas,
  crearExistencia,
  fetchProducts,
  crearTraslado
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
  const [encargadosData, setEncargadosData] = useState({});
  const [bodegasData, setBodegasData] = useState({});

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


  // --- Cargar encargados por sucursal ---
  useEffect(() => {
    if (!sucursales?.length) return;
    let isMounted = true;

    async function loadEncargados() {
      try {
        const results = await Promise.all(
          sucursales.map(async (suc) => {
            try {
              const data = await fetchUsers({ tokenUsuario, usuario, subdominio: subdominio });
      
              const encargadosPorSucursal = (data?.datos || []).filter(
                (u) => u.id_sucursal_default === suc.id
              );
              return { id: suc.id, count: encargadosPorSucursal.length };
            } catch {
              return { id: suc.id, count: 0 };
            }
          })
        );
        if (isMounted) {
          const map = {};
          results.forEach(({ id, count }) => (map[id] = count));
          setEncargadosData(map);
          
        }
      } catch (e) {
        console.error('Error cargando encargados:', e);
      }
    }

    loadEncargados();
    return () => { isMounted = false; };
  }, [sucursales, tokenUsuario, usuario]);


  // --- Cargar bodegas (dedup por subdominio) ---
  useEffect(() => {
    if (!Array.isArray(sucursales) || !sucursales.length) return;
    let cancelled = false;

    const getSucIdFromBodega = (b) =>
      Number(b?.sucursal_id ?? b?.id_sucursal ?? b?.sucursal);

    (async function loadBodegas() {
      try {
        // 1) subdominios únicos
        const subs = [...new Set(sucursales.map(s => s.subdominio))];

        // 2) pedir una vez por subdominio
        const datasets = await Promise.all(
          subs.map(async (sub) => {
            try {
              const resp = await fetchBodegas({
                tokenUsuario,
                usuario,
                subdominio: subdominio,
              });
              const datos = resp?.datos ?? resp?.data?.datos ?? [];
              return [sub, datos];
            } catch (e) {
              console.error('fetchBodegas falló para', sub, e);
              return [sub, []];
            }
          })
        );

        const bodegasBySub = Object.fromEntries(datasets);

        // 3) contar por sucursal usando su subdominio
        const entries = sucursales.map((suc) => {
          const bodegas = bodegasBySub[suc.subdominio] ?? [];
          const count = bodegas.filter(b => getSucIdFromBodega(b) === Number(suc.id)).length;
          return [suc.id, count];
        });

        if (!cancelled) {
          setBodegasData(Object.fromEntries(entries));
        }
      } catch (e) {
        console.error('Error cargando bodegas:', e);
      }
    })();

    return () => { cancelled = true; };
  }, [sucursales, tokenUsuario, usuario]);


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
    <main className="max-w-[1200px] mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Cabecera */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-8">
        {/* Buscador */}
        <div className="relative flex-1 max-w-xl w-full">
          <input
            type="text"
            placeholder="Buscar sucursales..."
            className="w-full border border-gray-300 rounded-full pl-10 pr-4 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:shadow-lg transition-shadow duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* Filtros rápidos */}
        <div className="flex gap-2 whitespace-nowrap overflow-x-auto">
          {['Todas', 'Activas', 'Inactivas'].map((label) => (
            <button
              key={label}
              onClick={() => setQuickFilter(label.toLowerCase())}
              className={`px-3 py-1 rounded-full text-sm transition duration-300 transform ${
                quickFilter === label.toLowerCase()
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Botón nueva sucursal */}
        <button
          onClick={() => setShowCreateForm((f) => !f)}
          className="flex items-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {showCreateForm ? 'Cancelar' : 'Nueva Sucursal'}
        </button>

        {/* Modal crear sucursal */}
        {showCreateForm && (
          <Modal onClose={() => setShowCreateForm(false)}>
            <h4 className="text-2xl font-semibold mb-4 text-gray-800">
              Aqui podras crear tu nueva sucursal
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
        <p className="text-center py-4 text-gray-600">Cargando sucursales…</p>
      ) : (
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSucursales.map((suc) => (
            <div
              key={suc.id}
              className="bg-white rounded-xl shadow p-6 flex flex-col h-full cursor-pointer hover:shadow-xl transition-shadow duration-300"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h5 className="text-xl font-semibold text-gray-800">{suc.nombre}</h5>

                <div className="flex items-center gap-3">
                  {/* Pill de usuarios */}
                  <span className="inline-flex items-center bg-blue-50 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                    <UsersIcon className="w-4 h-4 mr-1" />
                    {encargadosData[suc.id] ?? 0}
                  </span>

                  {/* Botón pill de bodegas (abre modal) */}
                  <button
                    type="button"
                    onClick={() => abrirNuevaBodega(suc)}
                    title={`Bodegas de ${suc.nombre}`}
                    className="
                      inline-flex items-center gap-1.5
                      bg-amber-50 text-amber-800
                      text-sm font-medium
                      px-2.5 py-0.5 rounded-full
                      border border-amber-200
                      hover:bg-amber-100
                      focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1
                      transition
                    "
                  >
                    <BuildingStorefrontIcon className="w-4 h-4" />
                    <span>{bodegasData[suc.id] ?? 0}</span>
                      
                  </button>
                </div>
              </div>

              {/* Datos */}
              <dl className="flex-grow grid grid-cols-1 gap-y-2">
                {[
                  ['Dirección', suc.direccion],
                  ['Ciudad', suc.ciudad],
                  ['País', suc.pais],
                ].map(([dt, dd]) => (
                  <div key={dt} className="flex justify-between">
                    <dt className="text-sm text-gray-500">{dt}</dt>
                    <dd className="text-sm text-gray-700">{dd}</dd>
                  </div>
                ))}
              </dl>
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

    </main>
  );
}
