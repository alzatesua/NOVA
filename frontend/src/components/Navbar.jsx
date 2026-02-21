import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';  // Importa tu hook correctamente
import { useTheme } from '../hooks/useTheme';
import { BellIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

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
    <div className="p-2 bg-slate-100 dark:!bg-slate-800 rounded-md shadow-sm text-xs text-slate-600 dark:!text-slate-300 transition-colors duration-200">
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
  const adminButtons = ['dashboard', 'usuarios', 'sucursales', 'productos', 'clientes', 'configuracion', 'facturacion'];
  const operarioButtons = ['entrada', 'productos', 'clientes', 'facturacion'];

  // Mapeo para mostrar nombres personalizados en los botones
  const viewLabels = {
    'dashboard': 'Dashboard',
    'usuarios': 'Usuarios',
    'sucursales': 'Sucursales',
    'productos': 'Productos',
    'clientes': 'Gestion clientes',
    'configuracion': 'Configuracion',
    'facturacion': 'Facturacion',
    'entrada': 'Entrada'
  };

  const { usuario, rol } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-md px-6 py-3.5 flex justify-between items-center border-b border-slate-300 dark:!border-slate-700 transition-colors duration-200">
      <span className="text-blue-600 dark:text-blue-400 font-bold text-xl cursor-pointer select-none transition-colors duration-200">Logo</span>
      <InfoSucursal />
      <div className="hidden md:flex space-x-8 text-slate-700 dark:!text-slate-200 font-semibold tracking-wide">
        {list.map(view => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 ${
              currentView === view ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 pb-1 font-bold' : ''
            }`}
          >
            {viewLabels[view] || (view.charAt(0).toUpperCase() + view.slice(1))}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-6">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(prev => !prev)}
            className="relative p-2.5 rounded-full bg-slate-100 dark:!bg-slate-800 shadow-sm hover:shadow-md hover:bg-slate-200 dark:hover:!bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            aria-label="Notificaciones"
          >
            <BellIcon className="h-5 w-5 text-slate-600 dark:!text-slate-300" />

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
              className="absolute right-0 mt-2 w-80 max-h-80 overflow-auto bg-white dark:!bg-slate-800 rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-700
                focus:outline-none z-50 origin-top-right animate-fadeIn"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="notifications-menu"
            >
              <div className="px-6 py-3 border-b border-slate-200 dark:!border-slate-700 font-semibold text-slate-800 dark:!text-slate-100 text-lg">
                Mis notificaciones
              </div>
              {notifications.length === 0 ? (
                <div className="px-6 py-4 text-slate-500 dark:!text-slate-400 text-center italic">No hay notificaciones.</div>
              ) : (
                notifications.map(({ id, message, time }) => (
                  <div
                    key={id}
                    className="px-6 py-3 border-b border-slate-100 dark:!border-slate-700 hover:bg-blue-50 dark:hover:!bg-slate-700 cursor-pointer transition-colors duration-150"
                    role="menuitem"
                    tabIndex={0}
                  >
                    <p className="text-slate-800 dark:!text-slate-100 font-medium">{message}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{time}</p>
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
            className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-full"
            aria-haspopup="true"
            aria-expanded={profileOpen}
            aria-label="Menú de perfil"
          >
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md select-none border-2 border-white dark:!border-slate-700"
              style={{ background: avatarBg }}
            >
              {usuario ? usuario.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden md:block text-slate-700 dark:!text-slate-200 font-semibold select-none tracking-wide">{usuario || 'Usuario'}</span>
            <svg
              className={`w-4 h-4 text-slate-500 dark:!text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
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
              className="absolute right-0 mt-2 w-64 bg-white dark:!bg-slate-800 rounded-xl shadow-lg ring-1 ring-slate-200 dark:ring-slate-700
                focus:outline-none z-50 origin-top-right animate-fadeIn"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="user-menu"
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:!border-slate-700">
                <p className="text-slate-900 dark:!text-slate-100 font-semibold truncate">{usuario}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 uppercase tracking-wide">{rol}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="w-full text-left px-6 py-3 flex items-center justify-between hover:bg-slate-100 dark:hover:!bg-slate-700 transition-colors duration-150 text-slate-700 dark:!text-slate-200"
                role="menuitem"
              >
                <span className="font-semibold">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5 text-amber-400" />
                ) : (
                  <MoonIcon className="h-5 w-5 text-slate-600 dark:!text-slate-400" />
                )}
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-6 py-3 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors duration-150 rounded-b-xl font-semibold text-slate-700 dark:!text-slate-200"
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
