import React, { useState, useEffect } from 'react';
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";

import { toast } from 'react-toastify';
import './animations.css';



function CrearTienda() {
  const [sub_dominio, setSubDominio] = useState(''); 
  const API_URL = import.meta.env.VITE_API_URL;
  const [step, setStep] = useState(1);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [paises, setPaises] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const [paisSeleccionado, setPaisSeleccionado] = useState('');


  // Paso 1: datos personales
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo_usuario, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [calleNumero, setCalleNumero] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');

  // Paso 2: tipo de tienda
  const [tipoTienda, setTipoTienda] = useState('');

  // Paso 3: datos tienda y acceso
  const [nombreTienda, setNombreTienda] = useState('');
  const [nit, setNit] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nivelSeguridad, setNivelSeguridad] = useState('');

  // Persona natural
  const [nombrePropietario, setNombrePropietario] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [documento, setDocumento] = useState('');

  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [confirmacionFinal, setConfirmacionFinal] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/tipos-documento/`)
      .then(res => res.json())
      .then(data => setTiposDocumento(data))
      .catch(err => console.error(err));
  }, []);
  useEffect(() => {
    fetch("/api/countries/")
      .then(res => res.json())
      .then(data => setPaises(data));
  }, []);
  useEffect(() => {
    if (paisSeleccionado) {
      fetch(`/api/cities/?country=${paisSeleccionado}`)
        .then(res => res.json())
        .then(data => setCiudades(data));
    } else {
      setCiudades([]);
      setCiudadSeleccionada('');
    }
  }, [paisSeleccionado]);



  const evaluarSeguridad = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score <= 3 ? 'Baja' : score === 4 ? 'Media' : 'Alta';
  };

  const validarPaso1 = () => {
    // Validar campos personales
    if (!nombreCompleto || !correo_usuario || !telefono || !calleNumero || !ciudadSeleccionada || !codigoPostal || !paisSeleccionado) {
      toast.warn("Todos los campos personales son obligatorios.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar tipo de tienda
    if (!tipoTienda) {
       toast.warn("Selecciona el tipo de tienda.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar campos de acceso
    if (!nombreTienda || !usuario || !password || !confirmPassword) {
      toast.warn("Todos los campos de acceso son obligatorios.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar coincidencia de contraseñas
    if (password !== confirmPassword) {
       toast.warn("Las contraseñas no coinciden.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
       toast.warn("La contraseña debe tener al menos 8 caracteres.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar nivel de seguridad de la contraseña (opcional pero recomendado)
    const nivelSeguridad = evaluarSeguridad(password);
    if (nivelSeguridad === 'Baja') {
      toast.warn("La contraseña es muy débil. Incluye mayúsculas, minúsculas, números y símbolos.", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo_usuario)) {
      toast.warn("Ingresa un correo electrónico válido.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar NIT para empresas
    if (tipoTienda === 'empresa' && !nit) {
       toast.warn("El NIT es obligatorio para empresas.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    // Validar datos del propietario para persona natural
    if (tipoTienda === 'persona' && (!nombrePropietario || !tipoDocumento || !documento)) {
       toast.warn("Datos del propietario requeridos.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }

    return true;
  };

 
  const handleNext = () => {
    if (step === 1 && validarPaso1()) setStep(2);

  };

  const handleBack = () => setStep(step > 1 ? step - 1 : 1);

  // Función para traducir campos al español
  const translateField = (field) => {
    const translations = {
      'direccion.calle_numero': 'Calle y número',
      'direccion.ciudad_estado': 'Ciudad',
      'direccion.codigo_postal': 'Código postal',
      'direccion.pais': 'País',
      'correo_usuario': 'Correo electrónico',
      'usuario': 'Usuario',
      'usuario_data.usuario': 'Usuario',
      'usuario_data.password': 'Contraseña',
      'password': 'Contraseña',
      'passwordConfirm': 'Confirmar contraseña',
      'nombre_tienda': 'Nombre de tienda',
      'nit': 'NIT',
      'nombre_propietario': 'Nombre del propietario',
      'numero_documento': 'Número de documento',
      'documento_data.tipo_id': 'Tipo de documento',
      'documento_data.documento': 'Número de documento',
      'telefono': 'Teléfono',
      'nombre_completo': 'Nombre completo',
      'tipo_tienda': 'Tipo de tienda'
    };
    return translations[field] || field.replace(/_/g, ' ');
  };

  // Función para traducir mensajes de error
  const translateErrorMessage = (message) => {
    const translations = {
      'This field may not be blank.': 'Este campo es obligatorio.',
      'This field is required.': 'Este campo es obligatorio.',
      'Enter a valid email address.': 'Ingresa un correo electrónico válido.',
      'A user with that email already exists.': 'Ya existe un usuario con ese correo.',
      'This password is too short.': 'La contraseña es muy corta.',
      'Ensure this field has no more than 150 characters.': 'Este campo no puede tener más de 150 caracteres.'
    };
    return translations[message] || message;
  };

  // Función para extraer mensajes de error del backend
  const extractErrorMessages = (errors, parentKey = '') => {
    let messages = [];

    for (const key in errors) {
      // Ignorar claves que sean números (índices de arrays)
      if (key === '0' || key === '1' || key === '2' || !isNaN(key)) {
        continue;
      }

      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      if (typeof errors[key] === 'object' && errors[key] !== null) {
        if (Array.isArray(errors[key])) {
          // Si es un array de mensajes, usar el primer mensaje
          const translatedField = translateField(fullKey);
          const translatedMessage = translateErrorMessage(errors[key][0]);
          messages.push(`${translatedField}: ${translatedMessage}`);
        } else {
          // Si es un objeto anidado, recursión
          messages = messages.concat(extractErrorMessages(errors[key], fullKey));
        }
      } else {
        // Si es un string directo
        const translatedField = translateField(fullKey);
        const translatedMessage = translateErrorMessage(errors[key]);
        messages.push(`${translatedField}: ${translatedMessage}`);
      }
    }

    return messages;
  };

  const handleSubmit = async () => {
    // Validar todos los campos del paso 1
    if (!validarPaso1()) {
      return; // Detener aquí si la validación falla
    }

    // Validar términos y condiciones
    if (!aceptaTerminos) {
      toast.warn("Debes aceptar los Términos y Condiciones.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return;
    }

  const data = {
    nombre_tienda: nombreTienda,
    nombre_completo: nombreCompleto,
    correo_usuario,
    telefono,
    nit: tipoTienda === 'empresa' ? nit : undefined,
    nombre_propietario: tipoTienda === 'persona' ? nombrePropietario : undefined,
    tipo_tienda: tipoTienda,
    direccion: {
      calle_numero: calleNumero,
      ciudad_estado: ciudadSeleccionada,
      codigo_postal: codigoPostal, 
      pais: paisSeleccionado
    },
    usuario_data: {
      usuario,
      password,
      correo_usuario,
      es_activo: false
    },
    ...(tipoTienda === 'persona' && tipoDocumento && documento
      ? {
          documento_data: {
            tipo_id: parseInt(tipoDocumento),
            documento
          }
        }
      : {})
  };


  try {
    const res = await fetch(`${API_URL}/tiendas/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const responseData = await res.json(); // ✅ Necesario para ver errores o data

    if (!res.ok) {
      // Extraer y mostrar todos los errores específicos del backend
      const errorMessages = extractErrorMessages(responseData);

      if (errorMessages.length > 0) {
        // Mostrar el primer error específico
        toast.error(errorMessages[0], {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });

        // Si hay más errores, mostrarlos también en toast adicionales
        errorMessages.slice(1, 3).forEach((msg, index) => {
          setTimeout(() => {
            toast.warn(msg, {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              theme: "colored",
            });
          }, (index + 1) * 1000);
        });
      } else {
        // Si no hay errores específicos, mostrar mensaje genérico
        toast.error("Error al crear la tienda. Por favor, verifica los datos.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      }
      return;
    }

    // Si todo fue bien
    setSubDominio(responseData.dominio);
    setConfirmacionFinal(true);
    setStep(2);
    toast.success("Tienda creada con éxito", {
      position: "top-right",
      autoClose: 3000, // ms
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  } catch (err) {
    toast.error("Error de conexión.", {
      position: "top-right",
      autoClose: 3000, // ms
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  }

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-orb1"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-orb2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl animate-orb3"></div>
      </div>

      {/* Animated sparkles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] left-[8%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle1"></div>
        <div className="absolute top-[12%] left-[22%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle2"></div>
        <div className="absolute top-[8%] right-[15%] w-1 h-1 bg-purple-400 rounded-full animate-sparkle3"></div>
        <div className="absolute top-[18%] right-[8%] w-1 h-1 bg-blue-300 rounded-full animate-sparkle4"></div>
        <div className="absolute top-[25%] left-[5%] w-1 h-1 bg-cyan-300 rounded-full animate-sparkle5"></div>
        <div className="absolute top-[22%] right-[25%] w-1 h-1 bg-purple-300 rounded-full animate-sparkle6"></div>
        <div className="absolute top-[35%] left-[12%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle7"></div>
        <div className="absolute top-[38%] right-[18%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle8"></div>
        <div className="absolute top-[45%] left-[7%] w-1 h-1 bg-purple-400 rounded-full animate-sparkle1"></div>
        <div className="absolute top-[48%] right-[12%] w-1 h-1 bg-blue-300 rounded-full animate-sparkle2"></div>
        <div className="absolute top-[55%] left-[20%] w-1 h-1 bg-cyan-300 rounded-full animate-sparkle3"></div>
        <div className="absolute top-[58%] right-[6%] w-1 h-1 bg-purple-300 rounded-full animate-sparkle4"></div>
        <div className="absolute top-[65%] left-[10%] w-1 h-1 bg-blue-400 rounded-full animate-sparkle5"></div>
        <div className="absolute top-[68%] right-[22%] w-1 h-1 bg-cyan-400 rounded-full animate-sparkle6"></div>
        <div className="absolute top-[75%] left-[15%] w-1 h-1 bg-purple-400 rounded-full animate-sparkle7"></div>
        <div className="absolute top-[78%] right-[10%] w-1 h-1 bg-blue-300 rounded-full animate-sparkle8"></div>
      </div>

      {/* Floating glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-float1"></div>
        <div className="absolute top-[60%] right-[15%] w-40 h-40 bg-purple-500/5 rounded-full blur-2xl animate-float2"></div>
        <div className="absolute bottom-[20%] left-[30%] w-36 h-36 bg-cyan-500/5 rounded-full blur-2xl animate-float3"></div>
        <div className="absolute top-[35%] right-[30%] w-28 h-28 bg-blue-500/4 rounded-full blur-2xl animate-float4"></div>
        <div className="absolute bottom-[45%] left-[15%] w-32 h-32 bg-purple-500/4 rounded-full blur-2xl animate-float5"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            step === 1 ? handleSubmit() : handleNext();
          }}
        >
          {/* PASO 1: Formulario de Registro */}
          {step === 1 && (
              <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/50 shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  {/* Logo and Brand */}
                  <div className="text-center mb-8">
                    <img
                      src="/logo-nova.png"
                      alt="Nova Logo"
                      className="w-48 h-auto mx-auto mb-4"
                      style={{
                        maxHeight: '100px',
                        objectFit: 'contain',
                        mixBlendMode: 'multiply'
                      }}
                    />
                    <h2 className="text-3xl font-bold text-white mb-2">Crea tu Tienda</h2>
                    <p className="text-slate-400 text-sm">
                      Comienza tu negocio con el sistema integral de inventario y e-commerce
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Nombre completo"
                      value={nombreCompleto}
                      onChange={(e) => setNombreCompleto(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={correo_usuario}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <Input
                      placeholder="Teléfono"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <Input
                      placeholder="Calle y número"
                      value={calleNumero}
                      onChange={(e) => setCalleNumero(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <Input
                      placeholder="Código postal"
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <select
                      value={paisSeleccionado}
                      onChange={(e) => setPaisSeleccionado(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    >
                      <option value="">Selecciona un país</option>
                      {paises.map((p) => (
                        <option key={p.id} value={p.code2} className="bg-slate-800">
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={ciudadSeleccionada}
                      onChange={(e) => setCiudadSeleccionada(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!ciudades.length}
                    >
                      <option value="">Selecciona una ciudad</option>
                      {ciudades.map((c) => (
                        <option key={c.id} value={c.name} className="bg-slate-800">
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={tipoTienda}
                      onChange={(e) => setTipoTienda(e.target.value)}
                      className="w-full bg-slate-800/50 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    >
                      <option value="">Tipo de tienda</option>
                      <option value="empresa" className="bg-slate-800">Empresa</option>
                      <option value="persona" className="bg-slate-800">Persona natural</option>
                    </select>
                    <Input
                      placeholder="Nombre tienda"
                      value={nombreTienda}
                      onChange={(e) => setNombreTienda(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />

                    {tipoTienda === 'empresa' && (
                      <Input
                        placeholder="NIT"
                        value={nit}
                        onChange={(e) => setNit(e.target.value)}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                      />
                    )}

                    {tipoTienda === 'persona' && (
                      <>
                        <Input
                          placeholder="Nombre del propietario"
                          value={nombrePropietario}
                          onChange={(e) => setNombrePropietario(e.target.value)}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                        />
                        <select
                          value={tipoDocumento}
                          onChange={(e) => setTipoDocumento(e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-700 text-white p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        >
                          <option value="">Tipo de documento</option>
                          {tiposDocumento.map(t => (
                            <option key={t.id} value={t.id} className="bg-slate-800">{t.nombre}</option>
                          ))}
                        </select>
                        <Input
                          placeholder="Número de documento"
                          value={documento}
                          onChange={(e) => setDocumento(e.target.value)}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                        />
                      </>
                    )}

                    <Input
                      placeholder="Usuario"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => {
                        const pwd = e.target.value;
                        setPassword(pwd);
                        setNivelSeguridad(evaluarSeguridad(pwd));
                      }}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                    <Input
                      type="password"
                      placeholder="Confirmar contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:ring-blue-500/50"
                    />
                  </div>

                  {password && (
                    <p className="text-sm mt-4 text-slate-300 text-center">
                      Nivel de seguridad: <span className={`font-bold ${nivelSeguridad === 'Alta' ? 'text-green-400' : nivelSeguridad === 'Media' ? 'text-yellow-400' : 'text-red-400'}`}>{nivelSeguridad}</span>
                    </p>
                  )}

                  <div className="py-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="terminos"
                        checked={aceptaTerminos}
                        onCheckedChange={(c) => setAceptaTerminos(c === true)}
                        className="border-slate-600"
                      />
                      <Label htmlFor="terminos" className="text-slate-300">
                        Al continuar, aceptas los{' '}
                        <a href="/terminos" className="underline text-blue-400 hover:text-blue-300">
                          Términos y condiciones
                        </a>{' '}
                        y la{' '}
                        <a href="/privacidad" className="underline text-blue-400 hover:text-blue-300">
                          Política de privacidad
                        </a>
                      </Label>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-blue-500 hover:via-cyan-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      type="submit"
                    >
                      🚀 Crear Tienda
                    </Button>
                  </div>
                </div>
              </div>
          )}



          {/* PASO 2: Confirmación y Activación */}
          {step === 2 && confirmacionFinal && (
            <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-slate-800/50 shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-cyan-500/20 opacity-30"></div>

              <div className="relative z-10 text-center">
                {/* Success Icon */}
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-4">¡Registro Exitoso!</h2>
                <p className="text-slate-300 mb-6">
                  Tu tienda ha sido creada correctamente
                </p>

                <div className="bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-700">
                  <p className="text-slate-400 text-sm mb-2">Tu tienda está disponible en:</p>
                  <a
                    className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-300 hover:to-cyan-300 transition-all"
                    href={"https://" + sub_dominio + ".nova.dagi.co/login"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {"https://" + sub_dominio + ".nova.dagi.co/login"}
                  </a>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <Button
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => {
                        const loginUrl = "https://" + sub_dominio + ".nova.dagi.co/login";
                        window.location.href = loginUrl;
                      }}
                    >
                      Ir a iniciar sesión
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default CrearTienda;
