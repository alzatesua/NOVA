import React, { useRef, useEffect } from 'react';

/**
 * EcommerceFooter - Footer del ecommerce con video de fondo
 */
export default function EcommerceFooter({
  nombreTienda = 'Nova',
  whatsappNumber = '+573000000000',
  onNavigate,
  darkMode = false
}) {
  const videoRef = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      console.log('🎥 Footer - Video encontrado');
      video.play().catch(err => console.log('Autoplay error:', err));
    }
  }, []);

  return (
    <>
      {/* Estilos específicos para el footer con video - alta prioridad */}
      <style>{`
        /* Resetear cualquier estilo que pueda afectar el footer */
        footer.ecommerce-video-footer,
        footer.ecommerce-video-footer * {
          box-sizing: border-box !important;
        }

        /* Footer transparente */
        footer.ecommerce-video-footer {
          background-color: transparent !important;
          background-image: none !important;
          background: none !important;
        }

        /* Video visible */
        footer.ecommerce-video-footer .footer-video-bg {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          z-index: 0 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          background: transparent !important;
        }

        /* Overlay */
        footer.ecommerce-video-footer .footer-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 1 !important;
          pointer-events: none !important;
        }

        /* Contenido */
        footer.ecommerce-video-footer .footer-content {
          position: relative !important;
          z-index: 2 !important;
          background: transparent !important;
        }

        /* Asegurar que el footer no tenga colores de fondo en dark mode */
        .dark footer.ecommerce-video-footer,
        [class*="dark"] footer.ecommerce-video-footer {
          background-color: transparent !important;
          background-image: none !important;
          background: none !important;
        }
      `}</style>

      <footer
        ref={footerRef}
        className="ecommerce-video-footer mt-auto"
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '280px',
          backgroundColor: 'transparent',
          backgroundImage: 'none',
          background: 'none'
        }}
      >
        {/* Video de fondo - Clase específica para CSS */}
        <video
          ref={videoRef}
          className="footer-video-bg"
          src="/videos/patinetas.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{
            filter: darkMode ? 'brightness(1.2) contrast(1.05)' : 'brightness(0.85)'
          }}
        />

        {/* Overlay - Más transparente en modo oscuro */}
        <div
          className="footer-overlay"
          style={{
            backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.35)'
          }}
        />

        {/* Contenido - Layout optimizado */}
        <div
          className="footer-content grid grid-cols-1 sm:grid-cols-3 gap-6 px-6 py-8 text-white items-center"
          style={{
            minHeight: '280px'
          }}
        >
          {/* Columna 1: Dirección */}
          <div className="text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 uppercase tracking-wide">
              📍 {nombreTienda}
            </h3>
            <div className="space-y-1 text-base" style={{ color: '#e0e0e0' }}>
              <p>Calle Principal #123</p>
              <p>Ciudad, País</p>
              <p>Tel: {whatsappNumber}</p>
              <p>Email: info@ecomotion.com</p>
            </div>
          </div>

          {/* Columna 2: Links */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 uppercase tracking-wide">
              🔗 Links Útiles
            </h3>
            <div className="space-y-1.5 text-base">
              {onNavigate ? (
                <button
                  onClick={() => onNavigate('nosotros')}
                  className="block hover:underline mx-auto sm:mx-0"
                  style={{ color: '#e0e0e0' }}
                >
                  ¿Quiénes Somos?
                </button>
              ) : (
                <span className="block hover:underline" style={{ color: '#e0e0e0' }}>
                  ¿Quiénes Somos?
                </span>
              )}
              <button className="block hover:underline mx-auto sm:mx-0" style={{ color: '#e0e0e0' }}>
                Política de Envíos
              </button>
              <button className="block hover:underline mx-auto sm:mx-0" style={{ color: '#e0e0e0' }}>
                Términos y Condiciones
              </button>
              <button className="block hover:underline mx-auto sm:mx-0" style={{ color: '#e0e0e0' }}>
                Garantías
              </button>
            </div>
          </div>

          {/* Columna 3: Redes Sociales - Iconos más grandes */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 uppercase tracking-wide text-center">
              🌐 Síguenos
            </h3>
            <div className="flex space-x-5">
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                style={{ backgroundColor: '#1877F2' }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                style={{ backgroundColor: '#E4405F' }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-16 h-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                style={{ backgroundColor: '#FF0000' }}
              >
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
