import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { MoonIcon, SunIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar({ rol: propRol, onViewChange, onLogout, currentView, mobileMenuOpen, setMobileMenuOpen }) {
  const adminButtons = ['dashboard', 'usuarios', 'sucursales', 'productos', 'clientes', 'configuracion', 'facturacion', 'caja', 'mora', 'proveedores'];
  const operarioButtons = ['entrada', 'productos', 'clientes', 'facturacion', 'caja', 'mora', 'proveedores'];

  const viewLabels = {
    dashboard: 'Dashboard',
    usuarios: 'Usuarios',
    sucursales: 'Sucursales',
    productos: 'Productos',
    clientes: 'Gestion clientes',
    configuracion: 'Configuracion',
    facturacion: 'Facturacion',
    entrada: 'Entrada',
    caja: 'Caja',
    mora: 'Gestión Mora',
    proveedores: 'Proveedores',
  };

  const { usuario, rol } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const list = rol === 'admin' ? adminButtons : operarioButtons;

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);
  const mobileRef = useRef(null);
  const [avatarBg, setAvatarBg] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
  const profileButtonRef = useRef(null);

  // Sincronizar el estado local con el prop del padre
  React.useEffect(() => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(mobileOpen);
    }
  }, [mobileOpen, setMobileMenuOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(event.target)) setMobileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const randomHue = () => Math.floor(Math.random() * 360);
    const color1 = `hsl(${randomHue()}, 70%, 50%)`;
    const color2 = `hsl(${(randomHue() + 60) % 360}, 70%, 50%)`;
    setAvatarBg(`linear-gradient(135deg, ${color1}, ${color2})`);
  }, []);

  // Calcular la posición del dropdown cuando se abre y cuando se hace scroll
  const updateDropdownPosition = () => {
    if (profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  };

  useEffect(() => {
    if (profileOpen) {
      updateDropdownPosition();
    }
  }, [profileOpen]);

  // Actualizar posición al hacer scroll
  useEffect(() => {
    if (profileOpen) {
      const handleScroll = () => {
        updateDropdownPosition();
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => window.removeEventListener('scroll', handleScroll, true);
    }
  }, [profileOpen]);

  return (
    <>
      {/* Estilos para animaciones de destellos - IGUALES AL FOOTER */}
      <style>{`
        @keyframes sparkle1 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(10px, -10px); }
        }

        @keyframes sparkle2 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-15px, 5px); }
        }

        @keyframes sparkle3 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(8px, 12px); }
        }

        @keyframes sparkle4 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1) translate(-12px, -8px); }
        }

        @keyframes sparkle5 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(12px, -8px); }
        }

        @keyframes sparkle6 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.2) translate(-10px, 10px); }
        }

        @keyframes sparkle7 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(15px, -15px); }
        }

        @keyframes sparkle8 {
          0%, 100% { opacity: 0; transform: scale(0) translate(0, 0); }
          50% { opacity: 1; transform: scale(1.5) translate(-18px, 12px); }
        }

        .animate-sparkle1 { animation: sparkle1 3s ease-in-out infinite; }
        .animate-sparkle2 { animation: sparkle2 4s ease-in-out infinite 0.5s; }
        .animate-sparkle3 { animation: sparkle3 3.5s ease-in-out infinite 1s; }
        .animate-sparkle4 { animation: sparkle4 4.5s ease-in-out infinite 1.5s; }
        .animate-sparkle5 { animation: sparkle5 2.8s ease-in-out infinite 0.3s; }
        .animate-sparkle6 { animation: sparkle6 3.1s ease-in-out infinite 0.7s; }
        .animate-sparkle7 { animation: sparkle7 3.5s ease-in-out infinite 0.2s; }
        .animate-sparkle8 { animation: sparkle8 3.2s ease-in-out infinite 1.3s; }

        /* Z-index del navbar */
        nav[data-navbar="true"] {
          z-index: 100 !important;
        }

        /* Estilos de botones con efectos focus */
        .nav-btn {
          position: relative;
          border: none;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .nav-btn:focus-visible {
          outline: 2px solid #0ea5e9;
          outline-offset: 2px;
          border-radius: 4px;
        }

        .profile-btn {
          border: none;
          background: transparent;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .profile-btn:hover {
          opacity: 0.85;
        }
        .profile-btn:focus-visible {
          outline: 2px solid #0ea5e9;
          outline-offset: 2px;
          border-radius: 99px;
        }

        .navbar-ham {
          border: none;
          cursor: pointer;
          border-radius: 8px;
          padding: 6px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .navbar-ham:focus-visible {
          outline: 2px solid #0ea5e9;
          outline-offset: 2px;
        }
      `}</style>

      {/* NAVBAR - MISMO ESTILO QUE EL FOOTER */}
      <nav
        className="bg-white dark:!bg-slate-900 border-b border-slate-200 dark:!border-slate-800 relative overflow-hidden"
        style={{
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
        }}
        data-navbar="true"
      >
        {/* Destellos animados - CON ESTILOS INLINE PARA FORZAR COLORES EN MODO OSCURO */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Pequeños destellos - 1px */}
          <div className="absolute top-[10%] left-[5%] w-1 h-1 rounded-full animate-sparkle1" style={{ backgroundColor: isDark ? '#93c5fd' : '#60a5fa' }}></div>
          <div className="absolute top-[20%] left-[15%] w-1 h-1 rounded-full animate-sparkle2" style={{ backgroundColor: isDark ? '#67e8f9' : '#22d3ee' }}></div>
          <div className="absolute top-[30%] right-[10%] w-1 h-1 rounded-full animate-sparkle3" style={{ backgroundColor: isDark ? '#c4b5fd' : '#a78bfa' }}></div>
          <div className="absolute top-[40%] right-[20%] w-1 h-1 rounded-full animate-sparkle4" style={{ backgroundColor: isDark ? '#bfdbfe' : '#93c5fd' }}></div>
          <div className="absolute top-[60%] left-[8%] w-1 h-1 rounded-full animate-sparkle1" style={{ backgroundColor: isDark ? '#a5f3fc' : '#67e8f9' }}></div>
          <div className="absolute top-[70%] right-[15%] w-1 h-1 rounded-full animate-sparkle2" style={{ backgroundColor: isDark ? '#ddd6fe' : '#c4b5fd' }}></div>
          <div className="absolute top-[80%] left-[12%] w-1 h-1 rounded-full animate-sparkle3" style={{ backgroundColor: isDark ? '#93c5fd' : '#60a5fa' }}></div>
          <div className="absolute top-[90%] right-[8%] w-1 h-1 rounded-full animate-sparkle4" style={{ backgroundColor: isDark ? '#67e8f9' : '#22d3ee' }}></div>

          {/* Destellos medios - 2px */}
          <div className="absolute top-[25%] left-[30%] w-2 h-2 rounded-full animate-sparkle5" style={{ backgroundColor: isDark ? '#60a5fa' : '#3b82f6' }}></div>
          <div className="absolute top-[50%] right-[25%] w-2 h-2 rounded-full animate-sparkle6" style={{ backgroundColor: isDark ? '#22d3ee' : '#06b6d4' }}></div>
          <div className="absolute top-[75%] left-[35%] w-2 h-2 rounded-full animate-sparkle1" style={{ backgroundColor: isDark ? '#a78bfa' : '#8b5cf6' }}></div>

          {/* Destellos grandes - 3px */}
          <div className="absolute top-[35%] left-[50%] w-3 h-3 rounded-full animate-sparkle7" style={{ backgroundColor: isDark ? '#60a5fa' : '#3b82f6' }}></div>
          <div className="absolute top-[65%] right-[45%] w-3 h-3 rounded-full animate-sparkle8" style={{ backgroundColor: isDark ? '#22d3ee' : '#06b6d4' }}></div>
        </div>

        {/* Contenido del navbar */}
        <div
          className="relative z-10 flex items-center justify-between w-full"
          style={{ height: '100%' }}
        >
          {/* Logo - Izquierda */}
          <div style={{ flexShrink: 0, width: '140px' }}>
            <img
              src="/logo-nova.png"
              alt="Nova"
              className="inline-block cursor-pointer"
              style={{
                width: '120px',
                height: 'auto',
                maxHeight: '36px',
                objectFit: 'contain',
                mixBlendMode: 'multiply',
                userSelect: 'none',
              }}
            />
          </div>

          {/* Desktop nav - CENTRADO */}
          <div
            className="navbar-desktop relative"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '68px',
              gap: '2px',
              flex: 1,
            }}
          >
            {list.map(view => {
              const isActive = currentView === view;
              return (
                <button
                  key={view}
                  className="nav-btn"
                  onClick={() => onViewChange(view)}
                  style={{
                    height: '68px',
                    padding: '0 20px',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    letterSpacing: '0.02em',
                    color: isActive ? '#0ea5e9' : (isDark ? '#94a3b8' : '#475569'),
                    background: isActive ? (isDark ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.08)') : 'transparent',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#0ea5e9';
                      e.currentTarget.style.background = isDark ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.07)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = isDark ? '#94a3b8' : '#475569';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {viewLabels[view] || view.charAt(0).toUpperCase() + view.slice(1)}
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: 0, left: '10px', right: '10px',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)',
                      boxShadow: '0 0 8px rgba(14,165,233,0.5)',
                      borderRadius: '2px 2px 0 0',
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side - Perfil y menú móvil */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, width: '120px', justifyContent: 'flex-end' }}>

            {/* Profile — desktop */}
            <div className="navbar-profile-desktop" ref={profileRef} style={{ position: 'relative' }}>
              <button
                ref={profileButtonRef}
                className="profile-btn"
                onClick={() => setProfileOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <div style={{
                  height: '38px', width: '38px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '15px',
                  background: avatarBg,
                  border: `2px solid ${isDark ? 'rgba(14,165,233,0.5)' : 'rgba(2,132,199,0.5)'}`,
                  boxShadow: isDark ? '0 0 16px rgba(14,165,233,0.4)' : '0 0 14px rgba(2,132,199,0.3)',
                  flexShrink: 0,
                }}>
                  {usuario ? usuario.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '13px', lineHeight: 1.2, margin: 0 }}>
                    {usuario || 'Usuario'}
                  </p>
                  <p style={{ color: '#0ea5e9', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                    {rol}
                  </p>
                </div>
              </button>
            </div>

            {/* Hamburger — mobile only */}
            <button
              className="navbar-ham"
              onClick={() => setMobileOpen(p => !p)}
              style={{
                background: isDark ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.07)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.07)'}
              aria-label="Menú"
            >
              {mobileOpen
                ? <XMarkIcon style={{ width: 22, height: 22, color: isDark ? '#94a3b8' : '#475569' }} />
                : <Bars3Icon style={{ width: 22, height: 22, color: isDark ? '#94a3b8' : '#475569' }} />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* DROPDOWN DEL PERFIL - PORTAL AL BODY (FIJO, NO SE MUEVE CON SCROLL) */}
      {profileOpen && createPortal(
        <div
          ref={profileRef}
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            width: '260px',
            background: isDark ? '#0f172a' : '#ffffff',
            border: `2px solid ${isDark ? '#1e293b' : '#cbd5e1'}`,
            borderRadius: '12px',
            boxShadow: isDark
              ? '0 12px 50px rgba(0,0,0,0.95), 0 0 0 2px rgba(255,255,255,0.08)'
              : '0 12px 50px rgba(0,0,0,0.25), 0 0 0 2px rgba(0,0,0,0.08)',
            zIndex: 999999,
            padding: '8px',
          }}
        >
          {/* Header con usuario */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, marginBottom: '4px' }}>
            <p style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 700, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario}</p>
            <p style={{ color: '#0ea5e9', fontSize: '11px', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{rol}</p>
          </div>

          {/* Opción: Cambiar tema */}
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              padding: '12px 14px',
              color: isDark ? '#e2e8f0' : '#1e293b',
              fontSize: '13px',
              fontWeight: 500,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: '6px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1e293b' : '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            {isDark
              ? <SunIcon style={{ height: 17, width: 17, color: '#fbbf24', flexShrink: 0 }} />
              : <MoonIcon style={{ height: 17, width: 17, color: '#0284c7', flexShrink: 0 }} />
            }
          </button>

          {/* Opción: Cerrar Sesión */}
          <button
            onClick={() => { setProfileOpen(false); onLogout(); }}
            style={{
              width: '100%',
              padding: '12px 14px',
              color: '#f87171',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? '#450a0a' : '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cerrar Sesión
          </button>
        </div>,
        document.body
      )}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          className="navbar-mobile-menu"
          style={{
            position: 'fixed',
            top: '68px',
            left: 0,
            right: 0,
            zIndex: 90,
            background: isDark ? '#0f172a' : '#ffffff',
            borderBottom: `2px solid ${isDark ? '#1e293b' : '#cbd5e1'}`,
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 24px rgba(14,165,233,0.12)',
            padding: '8px 0 12px',
            maxHeight: 'calc(100vh - 68px)',
            overflowY: 'auto',
          }}
        >
          {/* Nav items */}
          {list.map(view => {
            const isActive = currentView === view;
            return (
              <button
                key={view}
                onClick={() => { onViewChange(view); setMobileOpen(false); }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '13px 24px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#0ea5e9' : (isDark ? '#94a3b8' : '#475569'),
                  background: isActive ? (isDark ? '#1e293b' : '#e2e8f0') : 'transparent',
                  borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? '#1e293b' : '#f1f5f9'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {viewLabels[view] || view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ margin: '10px 24px', height: '1px', background: isDark ? '#334155' : '#e2e8f0' }} />

          {/* User info + actions */}
          <div style={{ padding: '4px 24px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              height: '40px', width: '40px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '16px',
              background: avatarBg,
              border: `2px solid ${isDark ? 'rgba(14,165,233,0.5)' : 'rgba(2,132,199,0.5)'}`,
              boxShadow: isDark ? '0 0 16px rgba(14,165,233,0.4)' : '0 0 14px rgba(2,132,199,0.3)',
            }}>
              {usuario ? usuario.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 600, fontSize: '14px', margin: 0 }}>{usuario || 'Usuario'}</p>
              <p style={{ color: '#0ea5e9', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{rol}</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 24px',
              border: 'none', cursor: 'pointer', background: 'transparent',
              fontSize: '14px', fontWeight: 500,
              color: isDark ? '#e2e8f0' : '#1e293b',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? '#1e293b' : '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            {isDark
              ? <SunIcon style={{ height: 18, width: 18, color: '#fbbf24' }} />
              : <MoonIcon style={{ height: 18, width: 18, color: '#0284c7' }} />
            }
          </button>

          <button
            onClick={onLogout}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 24px',
              border: 'none', cursor: 'pointer', background: 'transparent',
              fontSize: '14px', fontWeight: 600,
              color: '#f87171', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? '#450a0a' : '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* RESPONSIVE CSS */}
      <style>{`
        @media (max-width: 768px) {
          .navbar-desktop { display: none !important; }
          .navbar-profile-desktop { display: none !important; }
          .navbar-ham { display: flex !important; }
        }
        @media (min-width: 769px) {
          .navbar-ham { display: none !important; }
          .navbar-mobile-menu { display: none !important; }
        }
      `}</style>
    </>
  );
}
