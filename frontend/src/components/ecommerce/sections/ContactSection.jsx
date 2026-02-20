import React, { useState } from 'react';
import { COLORS, DARK_COLORS } from '../constants/colors';

/**
 * ContactSection - Sección "Contacto" del ecommerce
 *
 * Muestra información de contacto y formulario funcional
 */
export default function ContactSection({ activeSection, whatsappNumber = '+573000000000', darkMode = false }) {
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null

  // Solo renderizar si esta sección está activa
  if (activeSection !== 'contacto') {
    return null;
  }

  const bgColor = darkMode ? DARK_COLORS.background : COLORS.grisClaro;
  const cardBg = darkMode ? DARK_COLORS.cardBackground : 'rgba(255, 255, 255, 0.9)';
  const textColor = darkMode ? DARK_COLORS.textPrimary : COLORS.grisOscuro;

  // Función para obtener subdominio
  const getSubdomain = () => {
    const host = window.location.hostname;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return 'tu-subdominio-dev'; // Para desarrollo local
    }
    return host.split('.')[0];
  };

  // Manejar cambio de inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/contacto/enviar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subdominio: getSubdomain()
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
        // Resetear formulario
        setFormData({
          nombre_completo: '',
          email: '',
          mensaje: ''
        });
      } else {
        setSubmitStatus('error');
        console.error('Error enviando formulario:', await response.json());
      }
    } catch (error) {
      setSubmitStatus('error');
      console.error('Error de red:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Estilos CSS para el fondo animado */}
      <style>
        {`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
          }

          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.5; }
          }

          @keyframes drift {
            0% { transform: translate(0, 0) rotate(0deg); }
            33% { transform: translate(30px, -30px) rotate(120deg); }
            66% { transform: translate(-20px, 20px) rotate(240deg); }
            100% { transform: translate(0, 0) rotate(360deg); }
          }

          .animated-bg {
            background: linear-gradient(
              -45deg,
              ${COLORS.verdePrincipal},
              ${COLORS.verdeSecundario},
              ${COLORS.verdeMenta},
              ${COLORS.acentoTurquesa},
              ${COLORS.verdeOscuro}
            );
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
          }

          .floating-shape {
            position: absolute;
            border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            animation: float 6s ease-in-out infinite;
            pointer-events: none;
          }

          .floating-circle {
            position: absolute;
            border-radius: 50%;
            animation: pulse 4s ease-in-out infinite;
            pointer-events: none;
          }

          .floating-bolt {
            position: absolute;
            animation: drift 20s linear infinite;
            opacity: 0.15;
            pointer-events: none;
          }
        `}
      </style>

      <div className="py-8 sm:py-12 px-2 sm:px-4 relative animated-bg" style={{ minHeight: '600px', position: 'relative', overflow: 'hidden' }}>
        {/* Formas flotantes animadas de fondo */}
        <div className="floating-shape" style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          top: '10%',
          left: '5%',
          animationDelay: '0s'
        }}></div>
        <div className="floating-shape" style={{
          width: '120px',
          height: '120px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          top: '60%',
          right: '10%',
          animationDelay: '2s'
        }}></div>
        <div className="floating-circle" style={{
          width: '60px',
          height: '60px',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          bottom: '20%',
          left: '20%',
          animationDelay: '1s'
        }}></div>
        <div className="floating-circle" style={{
          width: '100px',
          height: '100px',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          top: '30%',
          right: '25%',
          animationDelay: '1.5s'
        }}></div>
        <div className="floating-shape" style={{
          width: '70px',
          height: '70px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          bottom: '15%',
          right: '15%',
          animationDelay: '0.5s'
        }}></div>
        <div className="floating-bolt" style={{
          fontSize: '40px',
          top: '25%',
          left: '40%',
          animationDelay: '3s'
        }}>⚡</div>
        <div className="floating-bolt" style={{
          fontSize: '30px',
          bottom: '30%',
          right: '30%',
          animationDelay: '5s'
        }}>🛴</div>

        {/* Contenido con z-index para aparecer encima */}
        <div style={{ maxWidth: '56rem', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 md:mb-12 text-center"
            style={{ color: 'white', textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)' }}>
          Contáctanos
        </h1>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          <div className="rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-md"
               style={{ backgroundColor: cardBg }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
                style={{ color: COLORS.verdePrincipal }}>
              Información de Contacto
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xl sm:text-2xl">📍</span>
                <p className="text-sm sm:text-base" style={{ color: COLORS.grisOscuro }}>Calle Principal #123, Ciudad</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xl sm:text-2xl">📞</span>
                <p className="text-sm sm:text-base" style={{ color: COLORS.grisOscuro }}>Tel: {whatsappNumber}</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xl sm:text-2xl">✉️</span>
                <p className="text-sm sm:text-base" style={{ color: COLORS.grisOscuro }}>info@ecomotion.com</p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xl sm:text-2xl">⏰</span>
                <p className="text-sm sm:text-base" style={{ color: COLORS.grisOscuro }}>Lun-Sáb: 9:00 AM - 7:00 PM</p>
              </div>
            </div>

            <div className="mt-6 sm:mt-8">
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4"
                  style={{ color: COLORS.verdeOscuro }}>
                Síguenos en Redes
              </h3>
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  style={{ backgroundColor: '#1877F2' }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  style={{ backgroundColor: '#E4405F' }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
                  style={{ backgroundColor: '#FF0000' }}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 backdrop-blur-md"
               style={{ backgroundColor: cardBg }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
                style={{ color: COLORS.verdePrincipal }}>
              Envíanos un Mensaje
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {submitStatus === 'success' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#d4edda', color: '#155724' }}>
                  ¡Mensaje enviado exitosamente! Te contactaremos pronto.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
                  Error al enviar el mensaje. Por favor intenta nuevamente.
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2"
                       style={{ color: COLORS.grisOscuro }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.verdeMenta }}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2"
                       style={{ color: COLORS.grisOscuro }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.verdeMenta }}
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2"
                       style={{ color: COLORS.grisOscuro }}>
                  Mensaje
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  rows="4"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 focus:outline-none focus:ring-2 text-sm sm:text-base bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: COLORS.verdeMenta }}
                  placeholder="¿En qué podemos ayudarte?"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.verdePrincipal }}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </button>
            </form>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
