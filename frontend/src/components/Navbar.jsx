import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { MoonIcon, SunIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

function InfoSucursal() {
  return <div />;
}

function getRandomColor() {
  const randomHue = () => Math.floor(Math.random() * 360);
  const color1 = `hsl(${randomHue()}, 70%, 50%)`;
  const color2 = `hsl(${(randomHue() + 60) % 360}, 70%, 50%)`;
  return `linear-gradient(135deg, ${color1}, ${color2})`;
}

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

  useEffect(() => { setAvatarBg(getRandomColor()); }, []);

  // ── Tema tokens ──────────────────────────────────────────────
  const T = isDark ? {
    navBg: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 50%, #0a1628 100%)',
    navShadow: '0 4px 24px rgba(14,165,233,0.08), 0 1px 0 rgba(14,165,233,0.15)',
    navBorder: 'rgba(14,165,233,0.18)',
    logoBg: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    textDefault: '#94a3b8',
    textHover: '#bae6fd',
    textActive: '#0ea5e9',
    activeBg: 'linear-gradient(180deg, rgba(14,165,233,0.1) 0%, rgba(14,165,233,0.03) 100%)',
    hoverBg: 'rgba(14,165,233,0.06)',
    lineGradient: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)',
    lineGlow: '0 0 8px rgba(14,165,233,0.7)',
    avatarBorder: 'rgba(14,165,233,0.45)',
    avatarGlow: '0 0 14px rgba(14,165,233,0.3)',
    userNameColor: '#e2e8f0',
    rolColor: '#0ea5e9',
    dropBg: '#0d1f3c',
    dropBorder: 'rgba(14,165,233,0.2)',
    dropShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.1)',
    dropItemColor: '#cbd5e1',
    dropItemHoverBg: 'rgba(14,165,233,0.09)',
    mobileBg: '#0a1628',
    mobileBorder: 'rgba(14,165,233,0.15)',
    mobileItemActive: 'rgba(14,165,233,0.12)',
    mobileItemHover: 'rgba(14,165,233,0.06)',
    hamColor: '#94a3b8',
    divider: 'rgba(14,165,233,0.12)',
  } : {
    navBg: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 50%, #f0f7ff 100%)',
    navShadow: '0 4px 20px rgba(14,165,233,0.12), 0 1px 0 rgba(14,165,233,0.2)',
    navBorder: 'rgba(14,165,233,0.25)',
    logoBg: 'linear-gradient(90deg, #0284c7, #0ea5e9)',
    textDefault: '#475569',
    textHover: '#0284c7',
    textActive: '#0284c7',
    activeBg: 'linear-gradient(180deg, rgba(14,165,233,0.08) 0%, rgba(14,165,233,0.02) 100%)',
    hoverBg: 'rgba(14,165,233,0.07)',
    lineGradient: 'linear-gradient(90deg, transparent, #0284c7, transparent)',
    lineGlow: '0 0 6px rgba(2,132,199,0.5)',
    avatarBorder: 'rgba(2,132,199,0.4)',
    avatarGlow: '0 0 12px rgba(2,132,199,0.2)',
    userNameColor: '#1e293b',
    rolColor: '#0284c7',
    dropBg: '#ffffff',
    dropBorder: 'rgba(14,165,233,0.2)',
    dropShadow: '0 20px 40px rgba(14,165,233,0.15), 0 1px 0 rgba(14,165,233,0.1)',
    dropItemColor: '#334155',
    dropItemHoverBg: 'rgba(14,165,233,0.07)',
    mobileBg: '#f0f7ff',
    mobileBorder: 'rgba(14,165,233,0.2)',
    mobileItemActive: 'rgba(14,165,233,0.1)',
    mobileItemHover: 'rgba(14,165,233,0.05)',
    hamColor: '#475569',
    divider: 'rgba(14,165,233,0.15)',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap');

        .navbar-root { font-family: 'Sora', sans-serif; }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-fade { animation: fadeSlideDown 0.18s ease forwards; }

        @keyframes slideDown {
          from { opacity: 0; max-height: 0; }
          to   { opacity: 1; max-height: 600px; }
        }
        .anim-mobile { animation: slideDown 0.25s ease forwards; overflow: hidden; }

        @keyframes glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes orb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes orb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(0.9); }
          66% { transform: translate(20px, -20px) scale(1.1); }
        }

        @keyframes orb3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.2) rotate(180deg); }
        }

        .animate-glow { animation: glow 3s ease-in-out infinite; }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        .animate-orb1 { animation: orb1 15s ease-in-out infinite; }
        .animate-orb2 { animation: orb2 18s ease-in-out infinite; }
        .animate-orb3 { animation: orb3 20s linear infinite; }

        .nav-btn {
          position: relative; border: none; cursor: pointer;
          transition: color 0.2s, background 0.2s;
          white-space: nowrap;
        }
        .nav-btn:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; border-radius: 4px; }

        .profile-btn { border: none; background: transparent; cursor: pointer; transition: opacity 0.2s; }
        .profile-btn:hover { opacity: 0.85; }
        .profile-btn:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; border-radius: 99px; }

        .ham-btn {
          border: none; cursor: pointer; border-radius: 8px; padding: 6px;
          transition: background 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .ham-btn:focus-visible { outline: 2px solid #0ea5e9; outline-offset: 2px; }

        .drop-item {
          width: 100%; text-align: left; border: none; cursor: pointer;
          transition: background 0.15s, color 0.15s;
          font-family: 'Sora', sans-serif;
          display: flex; align-items: center; justify-content: space-between;
        }
        .drop-item:focus-visible { outline: 2px solid #0ea5e9; outline-offset: -2px; }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav
        className="navbar-root fixed top-0 left-0 right-0 z-50"
        style={{
          background: T.navBg,
          boxShadow: T.navShadow,
          borderBottom: `1px solid ${T.navBorder}`,
          height: '68px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'relative',
        }}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, overflow: 'visible' }}>
        {/* Animated gradient orbs */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-orb1"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-orb2"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl animate-orb3"></div>
        </div>
        </div>

        {/* Logo */}
        <div className="relative z-10" style={{
          flexShrink: 0,
        }}>
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 rounded-lg blur-lg animate-glow"></div>
            <span
              className="relative z-10 inline-block animate-gradient"
              style={{
                background: 'linear-gradient(to right, #0ea5e9, #38bdf8, #8b5cf6, #0ea5e9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '300% 300%',
                fontWeight: 800,
                fontSize: '24px',
                letterSpacing: '-0.5px',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              NOVA
            </span>
          </div>
        </div>

        <InfoSucursal />

        {/* Desktop nav */}
        <div
          className="navbar-desktop relative z-10"
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: '68px',
            gap: '2px',
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
                  color: isActive ? T.textActive : T.textDefault,
                  background: isActive ? T.activeBg : 'transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = T.textHover;
                    e.currentTarget.style.background = T.hoverBg;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = T.textDefault;
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {viewLabels[view] || view.charAt(0).toUpperCase() + view.slice(1)}
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: '10px', right: '10px',
                    height: '2px',
                    background: T.lineGradient,
                    boxShadow: T.lineGlow,
                    borderRadius: '2px 2px 0 0',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="relative z-10" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

          {/* Profile — desktop */}
          <div className="navbar-profile-desktop" ref={profileRef} style={{ position: 'relative' }}>
            <button
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
                border: `2px solid ${T.avatarBorder}`,
                boxShadow: T.avatarGlow,
                flexShrink: 0,
              }}>
                {usuario ? usuario.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: T.userNameColor, fontWeight: 600, fontSize: '13px', lineHeight: 1.2, margin: 0 }}>
                  {usuario || 'Usuario'}
                </p>
                <p style={{ color: T.rolColor, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                  {rol}
                </p>
              </div>
            </button>

            {profileOpen && (
              <div className="anim-fade" style={{
                position: 'fixed',
                right: 'clamp(12px, 2vw, 24px)',
                top: 'calc(68px + 8px)',
                width: '240px',
                background: T.dropBg,
                border: `1px solid ${T.dropBorder}`,
                borderRadius: '14px',
                boxShadow: T.dropShadow,
                overflow: 'visible',
                zIndex: 99999,
                maxHeight: '80vh',
                overflowY: 'auto',
              }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.divider}` }}>
                  <p style={{ color: T.userNameColor, fontWeight: 700, fontSize: '14px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usuario}</p>
                  <p style={{ color: T.rolColor, fontSize: '11px', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{rol}</p>
                </div>
                <button
                  className="drop-item"
                  onClick={toggleTheme}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    color: T.dropItemColor,
                    fontSize: '13px',
                    fontWeight: 500,
                    background: 'transparent',
                    borderBottom: `1px solid ${T.divider}`,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.dropItemHoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  {isDark
                    ? <SunIcon style={{ height: 17, width: 17, color: '#fbbf24', flexShrink: 0 }} />
                    : <MoonIcon style={{ height: 17, width: 17, color: T.rolColor, flexShrink: 0 }} />
                  }
                </button>
                <button
                  className="drop-item"
                  onClick={onLogout}
                  style={{
                    width: '100%',
                    padding: '13px 18px',
                    color: '#f87171',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxSizing: 'border-box'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="ham-btn navbar-ham"
            onClick={() => setMobileOpen(p => !p)}
            style={{ background: T.hoverBg }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = T.hoverBg}
            aria-label="Menú"
          >
            {mobileOpen
              ? <XMarkIcon style={{ width: 22, height: 22, color: T.hamColor }} />
              : <Bars3Icon style={{ width: 22, height: 22, color: T.hamColor }} />
            }
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU ────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          className="anim-mobile navbar-mobile-menu"
          style={{
            position: 'fixed',
            top: '68px',
            left: 0,
            right: 0,
            zIndex: 49,
            background: T.mobileBg,
            borderBottom: `1px solid ${T.mobileBorder}`,
            boxShadow: isDark
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(14,165,233,0.12)',
            padding: '8px 0 12px',
            maxHeight: 'calc(100vh - 68px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
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
                  fontFamily: "'Sora', sans-serif",
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.textActive : T.textDefault,
                  background: isActive ? T.mobileItemActive : 'transparent',
                  borderLeft: isActive ? `3px solid ${T.textActive}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.mobileItemHover; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {viewLabels[view] || view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            );
          })}

          {/* Divider */}
          <div style={{ margin: '10px 24px', height: '1px', background: T.divider }} />

          {/* User info + actions */}
          <div style={{ padding: '4px 24px 8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              height: '40px', width: '40px', borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '16px',
              background: avatarBg,
              border: `2px solid ${T.avatarBorder}`,
              boxShadow: T.avatarGlow,
            }}>
              {usuario ? usuario.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <p style={{ color: T.userNameColor, fontWeight: 600, fontSize: '14px', margin: 0 }}>{usuario || 'Usuario'}</p>
              <p style={{ color: T.rolColor, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{rol}</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 24px',
              border: 'none', cursor: 'pointer', background: 'transparent',
              fontFamily: "'Sora', sans-serif", fontSize: '14px', fontWeight: 500,
              color: T.dropItemColor,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.mobileItemHover}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            {isDark
              ? <SunIcon style={{ height: 18, width: 18, color: '#fbbf24' }} />
              : <MoonIcon style={{ height: 18, width: 18, color: T.rolColor }} />
            }
          </button>

          <button
            onClick={onLogout}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 24px',
              border: 'none', cursor: 'pointer', background: 'transparent',
              fontFamily: "'Sora', sans-serif", fontSize: '14px', fontWeight: 600,
              color: '#f87171', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      {/* ── RESPONSIVE CSS ─────────────────────────────────────── */}
      <style>{`
        /* Ocultar scrollbars y flechas de desplazamiento */
        .anim-fade::-webkit-scrollbar,
        .navbar-mobile-menu::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .anim-fade,
        .navbar-mobile-menu {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        @media (max-width: 768px) {
          .navbar-desktop { display: none !important; }
          .navbar-profile-desktop { display: none !important; }
          .navbar-ham { display: flex !important; }
        }
        @media (min-width: 769px) {
          .navbar-ham { display: none !important; }
          .navbar-mobile-menu { display: none !important; }
        }

        /* Mejoras para dropdown del perfil */
        .drop-item {
          width: 100%;
          box-sizing: border-box;
        }

        /* Mejoras para menú móvil */
        @media (max-width: 480px) {
          .navbar-mobile-menu {
            padding: '6px 0 10px' !important;
          }
          .navbar-mobile-menu button {
            padding: '11px 20px' !important;
            font-size: '13px' !important;
          }
        }
      `}</style>
    </>
  );
}