// src/components/Modal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function Modal({ children, onClose }) {
  // Prevenir propagación de scroll dentro del modal
  const handleWheel = (e) => {
    const target = e.currentTarget;
    const isScrollingDown = e.deltaY > 0;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight;
    const isAtTop = target.scrollTop === 0;

    // Si estamos en el top y scrolleamos hacia arriba, o en el bottom y scrolleamos hacia abajo
    if ((isAtTop && !isScrollingDown) || (isAtBottom && isScrollingDown)) {
      e.preventDefault();
    }
  };

  // Prevenir scroll en el backdrop
  const handleBackdropClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  // Prevenir propagación de eventos de touch/scroll
  const handleTouchMove = (e) => {
    const target = e.currentTarget;
    const isScrollingDown = e.touches[0].clientY < (e.touches[1]?.clientY || 0);
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight;
    const isAtTop = target.scrollTop === 0;

    if ((isAtTop && !isScrollingDown) || (isAtBottom && isScrollingDown)) {
      e.preventDefault();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      onWheel={e => e.stopPropagation()}
      onTouchMove={e => e.stopPropagation()}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <div
        className="
          relative
          rounded-2xl
          shadow-2xl
          w-full
          max-w-sm
          sm:max-w-2xl
          md:max-w-5xl
          lg:max-w-screen-xl
          xl:max-w-screen-2xl
          max-h-[85vh]
          overflow-y-auto
        "
        style={{
          backgroundColor: '#0B0D26',
          border: '1px solid',
          borderColor: '#1a1d3d'
        }}
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
      >
        {/* Estilos para animaciones de destellos */}
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
        `}</style>

        {/* Destellos animados */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {/* Pequeños destellos - 1px */}
          <div className="absolute top-[10%] left-[5%] w-1 h-1 rounded-full animate-sparkle1" style={{ backgroundColor: '#93c5fd' }}></div>
          <div className="absolute top-[20%] left-[15%] w-1 h-1 rounded-full animate-sparkle2" style={{ backgroundColor: '#67e8f9' }}></div>
          <div className="absolute top-[30%] right-[10%] w-1 h-1 rounded-full animate-sparkle3" style={{ backgroundColor: '#c4b5fd' }}></div>
          <div className="absolute top-[40%] right-[20%] w-1 h-1 rounded-full animate-sparkle4" style={{ backgroundColor: '#bfdbfe' }}></div>
          <div className="absolute top-[60%] left-[8%] w-1 h-1 rounded-full animate-sparkle1" style={{ backgroundColor: '#a5f3fc' }}></div>
          <div className="absolute top-[70%] right-[15%] w-1 h-1 rounded-full animate-sparkle2" style={{ backgroundColor: '#ddd6fe' }}></div>
          <div className="absolute top-[80%] left-[12%] w-1 h-1 rounded-full animate-sparkle3" style={{ backgroundColor: '#93c5fd' }}></div>
          <div className="absolute top-[90%] right-[8%] w-1 h-1 rounded-full animate-sparkle4" style={{ backgroundColor: '#67e8f9' }}></div>

          {/* Destellos medios - 2px */}
          <div className="absolute top-[25%] left-[30%] w-2 h-2 rounded-full animate-sparkle5" style={{ backgroundColor: '#60a5fa' }}></div>
          <div className="absolute top-[50%] right-[25%] w-2 h-2 rounded-full animate-sparkle6" style={{ backgroundColor: '#22d3ee' }}></div>
          <div className="absolute top-[75%] left-[35%] w-2 h-2 rounded-full animate-sparkle1" style={{ backgroundColor: '#a78bfa' }}></div>

          {/* Destellos grandes - 3px */}
          <div className="absolute top-[35%] left-[50%] w-3 h-3 rounded-full animate-sparkle7" style={{ backgroundColor: '#60a5fa' }}></div>
          <div className="absolute top-[65%] right-[45%] w-3 h-3 rounded-full animate-sparkle8" style={{ backgroundColor: '#22d3ee' }}></div>
        </div>

        {/* Contenido */}
        <div className="relative z-10 p-4 sm:p-5 lg:p-6">
          {/* CERRAR */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1 rounded-full transition-opacity hover:opacity-70 focus:outline-none"
            style={{ color: '#94a3b8' }}
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
