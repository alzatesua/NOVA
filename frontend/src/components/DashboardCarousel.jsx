import React, { useState, useEffect } from 'react';

export default function DashboardCarousel() {
  const slides = [
    {
      key: 'welcome',
      title: 'Panel de Administración',
      content: (
        <p className="text-lg text-slate-700 dark:!text-slate-300 max-w-xl mx-auto text-center transition-colors duration-200">
          Bienvenido al dashboard.
        </p>
      ),
    },
    {
      key: 'stats',
      title: 'Estadísticas',
      content: (
        <ul className="list-disc pl-5 text-slate-700 dark:!text-slate-300 max-w-xl mx-auto text-left space-y-2 transition-colors duration-200">
          <li>Usuarios registrados: <span className="font-semibold">120</span></li>
          <li>Productos disponibles: <span className="font-semibold">85</span></li>
          <li>Sucursales activas: <span className="font-semibold">7</span></li>
        </ul>
      ),
    },
    {
      key: 'noticias',
      title: 'Noticias recientes',
      content: (
        <p className="text-slate-700 dark:!text-slate-300 max-w-xl mx-auto text-center text-lg transition-colors duration-200">
          Próximamente nuevas funcionalidades para mejorar tu experiencia.
        </p>
      ),
    },
    {
      key: 'imagen-completa',
      // Sin título, solo imagen
      imgSrc: '/carrucel.png',
      imgAlt: 'Imagen Destacada',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goPrev = () => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  const slide = slides[currentIndex];

  return (
    <div className="relative w-full max-w-screen-xl mx-auto rounded-xl overflow-hidden bg-white dark:!bg-slate-900 shadow-lg select-none mt-6 md:mt-8 lg:mt-12 border border-slate-200 dark:!border-slate-800 transition-colors duration-200">
      {/* Si la slide tiene imagen, mostramos diferente layout */}
      {slide.imgSrc ? (
        <div className="flex items-center justify-center h-72 md:h-80 lg:h-96 p-6 bg-white dark:!bg-slate-900 transition-colors duration-200">
          <img
            src={slide.imgSrc}
            alt={slide.imgAlt}
            className="max-w-full max-h-full object-cover rounded-lg shadow-md"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-72 md:h-80 lg:h-96 p-10 text-center bg-white dark:!bg-slate-900 transition-colors duration-200">
          <h3 className="text-3xl font-extrabold text-slate-900 dark:!text-slate-100 mb-6">{slide.title}</h3>
          <div className="text-slate-700 dark:!text-slate-300">{slide.content}</div>
        </div>
      )}

      {/* Flechas */}
      <button
        onClick={goPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/50 dark:!bg-slate-700/70 hover:bg-slate-900/70 dark:hover:!bg-slate-600/80 text-white rounded-full p-3 focus:outline-none shadow-lg transition z-20 backdrop-blur-sm"
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/50 dark:!bg-slate-700/70 hover:bg-slate-900/70 dark:hover:!bg-slate-600/80 text-white rounded-full p-3 focus:outline-none shadow-lg transition z-20 backdrop-blur-sm"
        aria-label="Siguiente"
      >
        ›
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              idx === currentIndex ? 'bg-blue-400' : 'bg-slate-300 dark:!bg-slate-600 hover:bg-blue-300 dark:hover:!bg-slate-500'
            }`}
            aria-label={`Ir al slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>

     
  );
}
