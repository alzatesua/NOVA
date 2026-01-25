import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';  // Importa tu hook correctamente
import { BellIcon } from '@heroicons/react/24/outline';

function InfoSucursal() {
  const [nombreSucursal, setNombreSucursal] = useState('');
  const [idSucursal, setIdSucursal] = useState('');

  useEffect(() => {
    const nombre = localStorage.getItem('nombre_sucursal');
    const id = localStorage.getItem('id_sucursal');

    setNombreSucursal(nombre || '');
    setIdSucursal(id || '');
  }, []);

  return (
    <div className="p-2 bg-gray-100 rounded-md shadow text-xs">
      {/*<h2 className="text-sm font-semibold mb-1">Información de la sucursal</h2>
      <div className="space-y-0.5 leading-tight">
        <p><strong className="font-medium">Nombre:</strong> {nombreSucursal}</p>
        <p><strong className="font-medium">ID:</strong> {idSucursal}</p>
      </div>*/}
    </div>

  );
}


function getRandomColor() {
  const randomHue = () => Math.floor(Math.random() * 360);
  const color1 = `hsl(${randomHue()}, 70%, 50%)`;
  const color2 = `hsl(${(randomHue() + 60) % 360}, 70%, 50%)`;
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

export default function Navbar({ rol: propRol, onViewChange, onLogout, currentView }) {
  const adminButtons = ['dashboard', 'usuarios', 'sucursales', 'productos', 'reportes', 'facturacion'];
  const operarioButtons = ['entrada', 'productos', 'facturacion'];

  const { usuario, rol } = useAuth();
  const list = rol === 'admin' ? adminButtons : operarioButtons;

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [avatarBg, setAvatarBg] = useState('');

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // Ejemplo estático de notificaciones, puedes reemplazarlo con datos reales
  const notifications = [
    { id: 1, message: 'Nuevo usuario registrado', time: '2 min ago' },
    { id: 2, message: 'Producto agregado', time: '10 min ago' },
    { id: 3, message: 'Sucursal actualizada', time: '1 hr ago' },
  ];

  // Cerrar menús al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setAvatarBg(getRandomColor());
  }, []);

  return (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md px-8 py-4 flex justify-between items-center">
      <span className="text-blue-600 font-bold text-xl cursor-pointer select-none">Logo</span>
      <InfoSucursal />
      <div className="hidden md:flex space-x-8 text-gray-700 font-semibold tracking-wide">
        {list.map(view => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`hover:text-blue-600 transition-colors ${
              currentView === view ? 'text-blue-600 border-b-2 border-blue-600 pb-1 font-bold' : ''
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-8">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className="relative p-2 rounded-full bg-white shadow hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            aria-label="Notificaciones"
          >
            <BellIcon className="h-6 w-6 text-gray-600" />

            {notifications.length > 0 && (
              <span
                className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none
                  text-white bg-red-600 rounded-full shadow-lg select-none"
              >
                {notifications.length}
              </span>
            )}
          </button>


          {notifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 max-h-80 overflow-auto bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-10
                focus:outline-none z-50 origin-top-right animate-fadeIn"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="notifications-menu"
            >
              <div className="px-6 py-3 border-b border-gray-200 font-semibold text-gray-700 text-lg">
                Mis notificaciones
              </div>
              {notifications.length === 0 ? (
                <div className="px-6 py-4 text-gray-500 text-center italic">No hay notificaciones.</div>
              ) : (
                notifications.map(({ id, message, time }) => (
                  <div
                    key={id}
                    className="px-6 py-3 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition"
                    role="menuitem"
                    tabIndex={0}
                  >
                    <p className="text-gray-800 font-medium">{message}</p>
                    <p className="text-xs text-gray-400 mt-1">{time}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(prev => !prev)}
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            aria-label="Menú de perfil"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md select-none border-2 border-white"
              style={{ background: avatarBg }}
            >
              {usuario ? usuario.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden md:block text-gray-700 font-semibold select-none tracking-wide">{usuario || 'Usuario'}</span>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-10
                focus:outline-none z-50 origin-top-right animate-fadeIn"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu"
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-gray-900 font-semibold truncate">{usuario}</p>
                <p className="text-gray-400 text-xs mt-1 uppercase tracking-wide">{rol}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full text-left px-6 py-3 hover:bg-blue-600 hover:text-white transition-colors rounded-b-xl font-semibold"
                role="menuitem"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease forwards;
        }
      `}</style>
  </nav>

  );
}
