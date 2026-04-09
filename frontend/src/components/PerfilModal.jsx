import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CameraIcon, UserIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function PerfilModal({ isOpen, onClose, usuario, onSave }) {
  const [nombre, setNombre] = useState(usuario || '');
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Cargar foto existente si la hay
    const savedPhoto = localStorage.getItem(`foto_perfil_${usuario}`);
    if (savedPhoto) {
      setPreviewUrl(savedPhoto);
    }
  }, [usuario]);

  useEffect(() => {
    setNombre(usuario || '');
  }, [usuario]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }

      setFotoPerfil(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFotoPerfil(null);
    setPreviewUrl(null);
    localStorage.removeItem(`foto_perfil_${usuario}`);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!nombre.trim()) {
      alert('El nombre de perfil es requerido');
      return;
    }

    // Guardar foto en localStorage si hay una nueva
    if (fotoPerfil && previewUrl) {
      localStorage.setItem(`foto_perfil_${usuario}`, previewUrl);
    }

    onSave({
      nombre: nombre.trim(),
      foto: previewUrl
    });
  };

  const handleClose = () => {
    setNombre(usuario || '');
    setFotoPerfil(null);
    // No reseteamos previewUrl para mantener la foto existente
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
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

      <div className="fixed inset-0 z-50 overflow-y-auto" style={{ paddingTop: '60px' }}>
        <div className="flex items-start justify-center min-h-screen px-2 sm:px-4 py-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleClose}
            style={{ paddingTop: '60px' }}
          />

          {/* Modal Content */}
          <div
            className="relative rounded-2xl shadow-2xl w-full max-w-2xl mx-auto my-4 overflow-hidden"
            style={{
              maxHeight: 'calc(100vh - 100px)',
              backgroundColor: '#0B0D26',
              border: '1px solid',
              borderColor: '#1a1d3d'
            }}
          >
            {/* Destellos animados en el modal */}
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

            {/* Header */}
            <div
              className="sticky top-0 p-3 sm:p-4 md:p-6 z-10"
              style={{
                backgroundColor: '#0B0D26',
                borderBottom: '1px solid',
                borderColor: '#1a1d3d'
              }}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[rgb(37,99,235)] to-[rgb(29,78,216)] rounded-lg">
                    <UserCircleIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg md:text-2xl font-bold" style={{ color: '#ffffff' }}>
                      Configurar Perfil
                    </h2>
                    <p className="text-sm" style={{ color: '#cbd5e1' }}>
                      Personaliza tu información y foto de perfil
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  style={{ color: '#94a3b8' }}
                  className="hover:opacity-70 transition-colors flex-shrink-0"
                >
                  <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto relative z-10" style={{ maxHeight: 'calc(70vh - 60px)' }}>
              <div style={{ color: '#f1f5f9' }}>
                {/* Foto de perfil */}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '140px',
                        height: '140px',
                        margin: '0 auto',
                        position: 'relative',
                      }}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Foto de perfil"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            border: '4px solid #1e293b',
                            boxShadow: '0 0 20px rgba(14,165,233,0.3)',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '4px solid #1e293b',
                            boxShadow: '0 0 20px rgba(14,165,233,0.3)',
                          }}
                        >
                          <UserIcon style={{ width: 56, height: 56, color: 'white' }} />
                        </div>
                      )}

                      {/* Botón de cámara */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                          border: '3px solid #0B0D26',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(14,165,233,0.4)',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.1)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(14,165,233,0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,233,0.4)';
                        }}
                      >
                        <CameraIcon style={{ width: 20, height: 20, color: 'white' }} />
                      </button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>

                  {/* Acciones de foto */}
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(14,165,233,0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,233,0.3)';
                      }}
                    >
                      Cambiar Foto
                    </button>
                    {previewUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
                        }}
                      >
                        Eliminar Foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Nombre de perfil */}
                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#cbd5e1',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Nombre de Perfil
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ingresa tu nombre o el de tu empresa"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      fontSize: '15px',
                      border: '2px solid #1e293b',
                      borderRadius: '10px',
                      outline: 'none',
                      background: '#0f172a',
                      color: '#f1f5f9',
                      transition: 'all 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#0ea5e9';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14,165,233,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#1e293b';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Información */}
                <div
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(8,132,199,0.05) 100%)',
                    border: '1px solid rgba(14,165,233,0.2)',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#93c5fd',
                    lineHeight: '1.6',
                  }}
                >
                  <strong style={{ color: '#0ea5e9' }}>ℹ️ Información:</strong> Los cambios en el perfil se reflejarán en toda la aplicación.
                  Las imágenes se almacenan localmente en tu navegador y persistirán entre sesiones.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="p-3 sm:p-4 md:p-6 relative z-10"
              style={{
                borderTop: '1px solid',
                borderColor: '#1a1d3d',
                backgroundColor: '#0B0D26'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    padding: '12px 24px',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '2px solid #334155',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1e293b';
                    e.currentTarget.style.color = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(14,165,233,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14,165,233,0.3)';
                  }}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
