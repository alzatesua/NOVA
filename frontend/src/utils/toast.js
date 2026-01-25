// src/utils/toast.js
import { toast } from 'react-toastify';

const TOAST_OPTIONS = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'colored',
};

const DEFAULT_MESSAGES = {
  success: 'Operación realizada con éxito',
  warn:    'Atención: revisa los datos',
  error:   'Ha ocurrido un error',
};

export function showToast(type = 'error', message) {
  const toastMethod = toast[type] ?? toast.error;
  const text = message ?? DEFAULT_MESSAGES[type] ?? DEFAULT_MESSAGES.error;
  toastMethod(text, TOAST_OPTIONS);
}
