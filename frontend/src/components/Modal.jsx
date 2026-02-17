// src/components/Modal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function Modal({ children, onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="
          relative
          bg-white
          dark:!bg-slate-900
          rounded-xl
          shadow-lg
          w-full
          max-w-sm
          sm:max-w-xl
          md:max-w-3xl
          lg:max-w-screen-lg
          max-h-[85vh]
          overflow-y-auto
          p-6
        "
        onClick={e => e.stopPropagation()}
      >
        {/* CERRAR */}
        <button
          type="button"
          onClick={onClose}
          className="
            absolute top-4 right-4
            p-1 bg-white dark:!bg-slate-800 bg-opacity-80 rounded-full
            hover:bg-opacity-100 dark:hover:!bg-slate-700 transition
            focus:outline-none
          "
          aria-label="Cerrar"
        >
          <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200" />
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
}
