import React, { useState } from 'react';
import { toast } from 'react-toastify';
const API_URL = import.meta.env.VITE_API_URL;




function Login() {
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hostname = window.location.hostname;
    const subdominio = hostname.split('.')[0];

    try {
      const response = await fetch(`${API_URL}/validar/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario: correoUsuario,
        password: password,
        subdominio
      })
    });


      const data = await response.json();


      if (response.ok) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("token_usuario", data.token_usuario);
        localStorage.setItem("refresh_token", data.refresh);
        localStorage.setItem("usuario", data.usuario);
        localStorage.setItem("rol", data.rol);
        localStorage.setItem("slug", data.tienda_slug);
        localStorage.setItem("tienda", data.tienda);
        localStorage.setItem("nombre_sucursal", data.nombre_sucursal);
        localStorage.setItem("id_sucursal", data.id_sucursal_default);
         

        window.location.href = "/dashboard";
      } else {
          toast.error(data.error || "Credenciales inválidas.", {
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
      toast.error("Error al conectar con el servidor.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    }
  };

   return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">
          Iniciar sesión
        </h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="correoUsuario">
            Correo o usuario
          </label>
          <input
            id="correoUsuario"
            type="text"
            placeholder="ejemplo@correo.com"
            value={correoUsuario}
            onChange={(e) => setCorreoUsuario(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-600 mb-4 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
        >
          Iniciar sesión
        </button>

        <div className="mt-6 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <a href="https://dagi.co/registro/tienda" className="text-blue-600 hover:underline">
            Crea una aquí
          </a>
        </div>

        <div className="mt-4 text-center">
          <a href="/recuperar" className="text-sm text-blue-500 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </form>
    </div>
  );

}

export default Login;
