import React, { useState, useEffect } from 'react';
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";


import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode'; // ✅ Forma correcta con ESM

import { toast } from 'react-toastify';



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
  const [mensaje, setMensaje] = useState('');

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
    if (!nombreCompleto || !correo_usuario || !telefono || !calleNumero || !ciudadSeleccionada || !codigoPostal || !paisSeleccionado) {
      toast.warn("Todos los campos personales son obligatorios.", {
        position: "top-right",
        autoClose: 3000, // ms
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      }); 
      return false;
    }
    if (!tipoTienda) {
       toast.warn("Selecciona el tipo de tienda.", {
        position: "top-right",
        autoClose: 3000, // ms
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }
    if (!nombreTienda || !usuario || !password || !confirmPassword) {
       toast.warn("Todos los campos de acceso son obligatorios.", {
        position: "top-right",
        autoClose: 3000, // ms
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }
    if (password !== confirmPassword) {
       toast.warn("Las contraseñas no coinciden.", {
        position: "top-right",
        autoClose: 3000, // ms
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }
    if (password.length < 8) {
       toast.warn("Contraseña muy corta.", {
        position: "top-right",
        autoClose: 3000, // ms
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }
    if (tipoTienda === 'empresa' && !nit) {
       toast.warn("El NIT es obligatorio para empresas.", {
        position: "top-right",
        autoClose: 3000, // ms
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
      return false;
    }
    if (tipoTienda === 'persona' && (!nombrePropietario || !tipoDocumento || !documento)) {
       toast.warn("Datos del propietario requeridos.", {
        position: "top-right",
        autoClose: 3000, // ms
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

  const handleSubmit = async () => {
    if(validarPaso1()){
      if (!aceptaTerminos) {
        toast.warn("Debes aceptar los Términos.", {
          position: "top-right",
          autoClose: 3000, // ms
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        return;
      }
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
      if (responseData.correo_usuario) {
         toast.warn(responseData.correo_usuario[0], {
          position: "top-right",
          autoClose: 3000, // ms
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      } else {
        setMensaje("Error: " + JSON.stringify(responseData));
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
    <form
      className="space-y-4 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        step === 1 ? handleSubmit() : handleNext();
      }}
    >
      {mensaje && <p className="text-red-600">{mensaje}</p>}

      {/* PASO 1: Formulario de Registro */}
      {step === 1 && (
        <>
          <Card className="max-w-xl mx-auto mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Nombre completo" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
              <Input type="email" placeholder="Email" value={correo_usuario} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              <Input placeholder="Calle y número" value={calleNumero} onChange={(e) => setCalleNumero(e.target.value)} />
              <Input placeholder="Código postal" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} />
              <select
                value={paisSeleccionado}
                onChange={(e) => setPaisSeleccionado(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Selecciona un país</option>
                {paises.map((p) => (
                  <option key={p.id} value={p.code2}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={ciudadSeleccionada}
                onChange={(e) => setCiudadSeleccionada(e.target.value)}
                className="w-full border p-2 rounded"
                disabled={!ciudades.length}
              >
                <option value="">Selecciona una ciudad</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select value={tipoTienda} onChange={(e) => setTipoTienda(e.target.value)} className="w-full border p-2 rounded">
                <option value="">Tipo de tienda</option>
                <option value="empresa">Empresa</option>
                <option value="persona">Persona natural</option>
              </select>
              <Input placeholder="Nombre tienda" value={nombreTienda} onChange={(e) => setNombreTienda(e.target.value)} />

              {tipoTienda === 'empresa' && (
                <Input placeholder="NIT" value={nit} onChange={(e) => setNit(e.target.value)} />
              )}

              {tipoTienda === 'persona' && (
                <>
                  <Input placeholder="Nombre del propietario" value={nombrePropietario} onChange={(e) => setNombrePropietario(e.target.value)} />
                  <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)} className="w-full border p-2 rounded">
                    <option value="">Tipo de documento</option>
                    {tiposDocumento.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  <Input placeholder="Número de documento" value={documento} onChange={(e) => setDocumento(e.target.value)} />
                </>
              )}

              <Input placeholder="Usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => {
                  const pwd = e.target.value;
                  setPassword(pwd);
                  setNivelSeguridad(evaluarSeguridad(pwd));
                }}
              />
              <Input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {password && (
              <p className="text-sm mt-2">
                Nivel de seguridad: <b>{nivelSeguridad}</b>
              </p>
            )}

          
            <CardContent className="py-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terminos"
                  checked={aceptaTerminos}
                  onCheckedChange={(c) => setAceptaTerminos(c === true)}
                />
                <Label htmlFor="terminos">
                  Al continuar, aceptas los 
                  <a href="/terminos" className="underline text-blue-600">
                     Términos y condiciones
                  </a> y la 
                  <a href="/terminos" className="underline text-blue-600">
                     Politica de privacidad.
                  </a>
                </Label>
              </div>
              <Button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200" type="submit">Crear Tienda</Button>
            </CardContent>
          </Card>
        </>
      )}



      {/* PASO 2: Confirmación y Activación */}
      {step === 2 && (
        <div className="text-center">
          <h2 className="text-xl font-bold">Registro Exitoso</h2>
          <p className="text-sm text-gray-700">
            Tu tienda fue creada en:{" "}
            <a
              className="underline text-blue-600"
              href={`https://${sub_dominio}.dagi.co/login`}
              target="_blank"
              rel="noopener noreferrer"
            >
              https://{sub_dominio}.dagi.co/login
            </a>
          </p>

          <p className="mt-4">Activa tu tienda con:</p>

          <div className="flex flex-col items-center gap-4 mt-4">
            <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
              <GoogleLogin
                ux_mode="popup"
                onSuccess={async (credentialResponse) => {
                  try {
                    const decoded = jwtDecode(credentialResponse.credential);
                    const tokenGoogle = credentialResponse.credential;

                    const res = await fetch("https://dagi.co/api/activar-tienda/", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ token: tokenGoogle }),
                    });

                    if (res.ok) {
                        toast.success("Tienda activada correctamente", {
                          position: "top-right",
                          autoClose: 3000, // ms
                          hideProgressBar: false,
                          closeOnClick: true,
                          pauseOnHover: true,
                          draggable: true,
                          theme: "colored",
                        });
                      
                        if (sub_dominio) {
                          window.location.href = `https://${sub_dominio}.dagi.co`;
                        } else {
                           toast.warn("Tienda valida, pero no se encontró el dominio.", {
                            position: "top-right",
                            autoClose: 3000, // ms
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            theme: "colored",
                          });
                        }
                    } else {
                      const err = await res.json();
                      toast.error(`Error: ${err.error}`, {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "colored",
                      });

                    }
                  } catch (err) {
                    console.error(err);
                    toast.error("Error al conectar con el servidor", {
                      position: "top-right",
                      autoClose: 3000, // ms
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      theme: "colored",
                    });
                  }
                }}
                onError={() => 
                  toast.error("Error en el inicio con Google", {
                    position: "top-right",
                    autoClose: 3000, // ms
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "colored",
                  })
     
                }
              />
            </GoogleOAuthProvider>

            <Button className="bg-green-600 text-white">Token</Button>

            <Button
              className="bg-blue-600 text-white"
              onClick={() =>
                window.location.href = `https://${sub_dominio}.dagi.co/login`
              }
            >
              Iniciar sesión en tu tienda
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

export default CrearTienda;
