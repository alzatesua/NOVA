/**
 * Hook personalizado de React para protección XSS
 *
 * Proporciona funciones y componentes para prevenir XSS en aplicaciones React
 *
 * Autor: Security Suite
 * Fecha: 2026-04-13
 */

import { useState, useCallback, useEffect } from 'react';
import {
  sanitizeHTML,
  stripHTML,
  escapeHTML,
  containsSuspiciousContent,
  validateUserInput,
  sanitizeURL,
  safeTruncate,
  validateFormData,
} from '../utils/xssProtection';

/**
 * Hook para sanitizar input de usuario en tiempo real
 *
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Funciones y estado para sanitización
 */
export const useXSSProtection = (options = {}) => {
  const [sanitized, setSanitized] = useState('');
  const [hasSuspiciousContent, setHasSuspiciousContent] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Sanitiza input en tiempo real
   *
   * @param {string} input - Input a sanitizar
   * @returns {string} - Input sanitizado
   */
  const sanitizeInput = useCallback((input) => {
    if (typeof input !== 'string') {
      setSanitized('');
      setHasSuspiciousContent(false);
      setError(null);
      return '';
    }

    // Detectar contenido sospechoso
    const suspicious = containsSuspiciousContent(input);
    setHasSuspiciousContent(suspicious);

    if (suspicious) {
      setError('Se detectó contenido HTML o JavaScript no permitido');
      setSanitized(stripHTML(input));
      return stripHTML(input);
    }

    // Sanitizar
    const clean = sanitizeHTML(input, options);
    setSanitized(clean);
    setError(null);

    return clean;
  }, [options]);

  /**
   * Valida input completo
   *
   * @param {string} input - Input a validar
   * @returns {Object} - Resultado de validación
   */
  const validateInput = useCallback((input) => {
    return validateUserInput(input, options);
  }, [options]);

  return {
    sanitized,
    hasSuspiciousContent,
    error,
    sanitizeInput,
    validateInput,
  };
};

/**
 * Hook para proteger formularios contra XSS
 *
 * @param {Object} schema - Esquema de validación del formulario
 * @returns {Object} - Funciones y estado para validación de formularios
 */
export const useProtectedForm = (schema) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  /**
   * Actualiza un campo del formulario
   *
   * @param {string} field - Nombre del campo
   * @param {string} value - Valor del campo
   */
  const updateField = useCallback((field, value) => {
    // Actualizar valor
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Marcar como touched
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Validar campo
    const fieldSchema = schema[field];
    if (fieldSchema) {
      const validation = validateUserInput(value, {
        maxLength: fieldSchema.maxLength || 1000,
        allowHTML: fieldSchema.allowHTML || false,
        fieldName: field,
      });

      if (!validation.valid) {
        setErrors((prev) => ({
          ...prev,
          [field]: validation.error,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  }, [schema]);

  /**
   * Valida todo el formulario
   *
   * @returns {boolean} - True si el formulario es válido
   */
  const validateForm = useCallback(() => {
    const validation = validateFormData(formData, schema);
    setErrors(validation.errors);
    setIsValid(validation.valid);
    return validation.valid;
  }, [formData, schema]);

  /**
   * Reinicia el formulario
   */
  const resetForm = useCallback(() => {
    setFormData({});
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, []);

  return {
    formData,
    errors,
    touched,
    isValid,
    updateField,
    validateForm,
    resetForm,
  };
};

/**
 * Hook para truncar texto de forma segura
 *
 * @param {number} maxLength - Longitud máxima del texto
 * @param {string} suffix - Sufijo a agregar cuando se trunca
 * @returns {Function} - Función para truncar texto
 */
export const useSafeTruncate = (maxLength = 100, suffix = '...') => {
  const truncate = useCallback((text) => {
    return safeTruncate(text, maxLength, suffix);
  }, [maxLength, suffix]);

  return { truncate };
};

/**
 * Componente para renderizar contenido de forma segura
 *
 * @param {string} content - Contenido a renderizar
 * @param {string} className - Clase CSS opcional
 * @returns {JSX.Element} - Contenido renderizado de forma segura
 */
export const SafeContent = ({ content, className = '', tag = 'div' }) => {
  const [sanitizedContent, setSanitizedContent] = useState('');

  useEffect(() => {
    if (typeof content === 'string') {
      setSanitizedContent(sanitizeHTML(content));
    } else {
      setSanitizedContent(String(content || ''));
    }
  }, [content]);

  const Tag = tag;

  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
  );
};

/**
 * Componente para input de texto protegido contra XSS
 *
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} - Input protegido
 */
export const ProtectedInput = ({
  value,
  onChange,
  maxLength = 1000,
  allowHTML = false,
  showWarning = true,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [warning, setWarning] = useState(null);

  const handleChange = (e) => {
    const newValue = e.target.value;

    // Detectar contenido sospechoso
    if (!allowHTML && containsSuspiciousContent(newValue)) {
      setWarning('⚠️ No se permite HTML o JavaScript');
      setLocalValue(stripHTML(newValue));
      onChange?.(stripHTML(newValue));
      return;
    }

    setWarning(null);
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <div className="protected-input">
      <input
        {...props}
        value={localValue}
        onChange={handleChange}
        maxLength={maxLength}
      />
      {showWarning && warning && (
        <span className="xss-warning">{warning}</span>
      )}
    </div>
  );
};

/**
 * Componente para textarea protegido contra XSS
 *
 * @param {Object} props - Props del componente
 * @returns {JSX.Element} - Textarea protegido
 */
export const ProtectedTextarea = ({
  value,
  onChange,
  maxLength = 5000,
  allowHTML = false,
  showWarning = true,
  rows = 4,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [warning, setWarning] = useState(null);
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e) => {
    const newValue = e.target.value;

    // Detectar contenido sospechoso
    if (!allowHTML && containsSuspiciousContent(newValue)) {
      setWarning('⚠️ No se permite HTML o JavaScript');
      const clean = stripHTML(newValue);
      setLocalValue(clean);
      setCharCount(clean.length);
      onChange?.(clean);
      return;
    }

    setWarning(null);
    setLocalValue(newValue);
    setCharCount(newValue.length);
    onChange?.(newValue);
  };

  return (
    <div className="protected-textarea">
      <textarea
        {...props}
        value={localValue}
        onChange={handleChange}
        maxLength={maxLength}
        rows={rows}
      />
      <div className="textarea-footer">
        {showWarning && warning && (
          <span className="xss-warning">{warning}</span>
        )}
        <span className="char-count">
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
};

/**
 * Hook para sanitizar URLs
 *
 * @returns {Object} - Funciones para sanitizar URLs
 */
export const useURLProtection = () => {
  const sanitizeURL = useCallback((url) => {
    if (typeof url !== 'string') {
      return { safe: false, sanitized: '' };
    }

    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    let sanitized = url;

    try {
      // Crear un elemento anchor para parsear la URL
      const parser = document.createElement('a');
      parser.href = url;

      // Verificar protocolo
      if (parser.protocol && !allowedProtocols.includes(parser.protocol)) {
        return {
          safe: false,
          sanitized: '',
          error: 'Protocolo no permitido',
        };
      }

      return {
        safe: true,
        sanitized: url,
      };
    } catch (e) {
      return {
        safe: false,
        sanitized: '',
        error: 'URL inválida',
      };
    }
  }, []);

  return { sanitizeURL };
};

/**
 * Hook para detectar intentos de XSS en input
 *
 * @returns {Object} - Estado y funciones de detección
 */
export const useXSSDetector = () => {
  const [attempts, setAttempts] = useState([]);

  const detect = useCallback((input) => {
    if (typeof input !== 'string') {
      return false;
    }

    const suspicious = containsSuspiciousContent(input);

    if (suspicious) {
      setAttempts((prev) => [
        ...prev,
        {
          timestamp: new Date(),
          input: input.substring(0, 100),  // Guardar solo los primeros 100 chars
        },
      ]);
    }

    return suspicious;
  }, []);

  const clearAttempts = useCallback(() => {
    setAttempts([]);
  }, []);

  const getAttemptCount = useCallback(() => {
    return attempts.length;
  }, [attempts.length]);

  return {
    detect,
    attempts,
    clearAttempts,
    getAttemptCount,
  };
};

export default {
  useXSSProtection,
  useProtectedForm,
  useSafeTruncate,
  SafeContent,
  ProtectedInput,
  ProtectedTextarea,
  useURLProtection,
  useXSSDetector,
};
