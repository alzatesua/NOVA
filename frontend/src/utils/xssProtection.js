/**
 * Utilidades de protección XSS para el frontend
 *
 * Proporciona funciones para sanitizar input y prevenir ataques XSS
 *
 * Autor: Security Suite
 * Fecha: 2026-04-13
 */

/**
 * Sanitiza HTML para prevenir XSS usando una implementación nativa
 * Nota: Para producción, instalar y usar DOMPurify: npm install dompurify
 *
 * @param {string} dirty - HTML potencialmente sucio
 * @param {Object} options - Opciones de configuración
 * @returns {string} - HTML limpio y seguro
 */
export const sanitizeHTML = (dirty, options = {}) => {
  if (typeof dirty !== 'string') {
    return '';
  }

  const {
    allowedTags = [],  // Por defecto, no permitir ninguna etiqueta
    allowedAttributes = {},  // Por defecto, no permitir ningún atributo
  } = options;

  // Si no se permiten etiquetas, remover todas
  if (allowedTags.length === 0) {
    return stripHTML(dirty);
  }

  // Implementación básica de sanitización
  // Para producción, usar DOMPurify que es más robusto
  return stripHTML(dirty);
};

/**
 * Remueve todas las etiquetas HTML de un string
 *
 * @param {string} html - String con HTML
 * @returns {string} - String sin HTML
 */
export const stripHTML = (html) => {
  if (typeof html !== 'string') {
    return '';
  }

  // Remover etiquetas HTML
  let clean = html.replace(/<[^>]*>/g, '');

  // Remover comentarios HTML
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  // Decodificar entidades HTML básicas
  clean = clean
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );

  return clean.trim();
};

/**
 * Escapa caracteres especiales de HTML
 *
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado seguro para HTML
 */
export const escapeHTML = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#96;',
    '=': '&#61;',
  };

  return text.replace(/[&<>"'`=/]/g, (char) => escapeMap[char] || char);
};

/**
 * Escapa atributos HTML
 *
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado seguro para atributos
 */
export const escapeHTMLAttribute = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Valida si un string contiene contenido potencialmente peligroso
 *
 * @param {string} input - Input a validar
 * @returns {boolean} - True si contiene contenido sospechoso
 */
export const containsSuspiciousContent = (input) => {
  if (typeof input !== 'string') {
    return false;
  }

  const suspiciousPatterns = [
    /<script\b[^>]*>.*?<\/script>/gi,  // Script tags
    /javascript:/gi,  // javascript: protocol
    /on\w+\s*=/gi,  // Event handlers (onclick, onload, etc.)
    /<iframe/gi,  // iframes
    /<object/gi,  // objects
    /<embed/gi,  // embeds
    /<link/gi,  // link tags
    /<meta/gi,  // meta tags
    /<style/gi,  // style tags
    /<applet/gi,  // applets
    /<form/gi,  // form tags
    /expression\s*\(/gi,  // CSS expression()
    /@import/gi,  // CSS @import
    /<\?php/gi,  // PHP tags
    /<\s*!\[CDATA\[/gi,  // CDATA sections
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
};

/**
 * Valida y sanitiza input de usuario para formularios
 *
 * @param {string} input - Input a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object} - { valid: boolean, sanitized: string, error: string }
 */
export const validateUserInput = (input, options = {}) => {
  const {
    maxLength = 1000,
    allowHTML = false,
    fieldName = 'campo',
  } = options;

  // Validar tipo
  if (typeof input !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: `El ${fieldName} debe ser un texto`,
    };
  }

  // Validar longitud
  if (input.length > maxLength) {
    return {
      valid: false,
      sanitized: input.substring(0, maxLength),
      error: `El ${fieldName} no puede exceder ${maxLength} caracteres`,
    };
  }

  // Detectar contenido sospechoso
  if (containsSuspiciousContent(input)) {
    return {
      valid: false,
      sanitized: stripHTML(input),
      error: `El ${fieldName} contiene HTML o JavaScript no permitido`,
    };
  }

  // Si no se permite HTML, sanitizar
  let sanitized = input;
  if (!allowHTML) {
    sanitized = stripHTML(input);
  }

  return {
    valid: true,
    sanitized: sanitized,
    error: null,
  };
};

/**
 * Sanitiza URLs para prevenir javascript: y otros protocolos peligrosos
 *
 * @param {string} url - URL a sanitizar
 * @returns {string} - URL segura o vacía si es peligrosa
 */
export const sanitizeURL = (url) => {
  if (typeof url !== 'string') {
    return '';
  }

  // Protocolos permitidos
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

  try {
    // Crear un elemento anchor para parsear la URL
    const parser = document.createElement('a');
    parser.href = url;

    // Verificar protocolo
    if (parser.protocol && !allowedProtocols.includes(parser.protocol)) {
      return '';  // Protocolo no permitido (javascript:, data:, etc.)
    }

    return url;
  } catch (e) {
    return '';  // URL inválida
  }
};

/**
 * Componente wrapper para safe rendering en React
 * Use esto en lugar de dangerouslySetInnerHTML
 *
 * @param {string} content - Contenido a renderizar de forma segura
 * @returns {string} - Contenido sanitizado
 */
export const safeRender = (content) => {
  if (typeof content !== 'string') {
    return '';
  }

  // Siempre sanitizar
  return sanitizeHTML(content);
};

/**
 * Valida nombres de archivos para prevenir path traversal
 *
 * @param {string} filename - Nombre de archivo a validar
 * @returns {boolean} - True si es seguro
 */
export const validateFileName = (filename) => {
  if (typeof filename !== 'string') {
    return false;
  }

  // Patrones peligrosos
  const dangerousPatterns = [
    /\.\./,  // Path traversal
    /[<>:"|?*]/,  // Caracteres inválidos en Windows
    /\//,  // Forward slash (path separator)
    /\\/,  // Backslash (path separator en Windows)
    /^\.+$/,  // Archivos ocultos o solo puntos
  ];

  // Verificar patrones
  if (dangerousPatterns.some((pattern) => pattern.test(filename))) {
    return false;
  }

  // Longitud máxima
  if (filename.length > 255) {
    return false;
  }

  return true;
};

/**
 * Crea un nombre de archivo seguro
 *
 * @param {string} filename - Nombre de archivo original
 * @returns {string} - Nombre de archivo seguro
 */
export const createSafeFileName = (filename) => {
  if (typeof filename !== 'string') {
    return 'file';
  }

  // Remover extensión
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

  // Remover caracteres peligrosos
  const safeName = name
    .replace(/[<>:"|?*\/\\]/g, '')  // Remover caracteres inválidos
    .replace(/\.\./g, '')  // Remover path traversal
    .replace(/\s+/g, '_')  // Reemplazar espacios con guiones bajos
    .substring(0, 200);  // Limitar longitud

  return safeName + ext;
};

/**
 * Trunca texto de forma segura
 *
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a agregar (por defecto: '...')
 * @returns {string} - Texto truncado
 */
export const safeTruncate = (text, maxLength, suffix = '...') => {
  if (typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  // Truncar y agregar sufijo
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Valida y sanitiza datos de formularios
 *
 * @param {Object} formData - Datos del formulario
 * @param {Object} schema - Esquema de validación
 * @returns {Object} - { valid: boolean, data: Object, errors: Object }
 */
export const validateFormData = (formData, schema) => {
  const errors = {};
  const sanitizedData = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field];

    // Validar tipo
    if (rules.required && (!value || value === '')) {
      errors[field] = `El campo ${field} es requerido`;
      continue;
    }

    // Si no es requerido y está vacío, continuar
    if (!rules.required && (!value || value === '')) {
      sanitizedData[field] = '';
      continue;
    }

    // Validar y sanitizar
    const validation = validateUserInput(value, {
      maxLength: rules.maxLength || 1000,
      allowHTML: rules.allowHTML || false,
      fieldName: field,
    });

    if (!validation.valid) {
      errors[field] = validation.error;
    } else {
      sanitizedData[field] = validation.sanitized;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: sanitizedData,
    errors,
  };
};

// Valores por defecto para exportar
const xssProtection = {
  sanitizeHTML,
  stripHTML,
  escapeHTML,
  escapeHTMLAttribute,
  containsSuspiciousContent,
  validateUserInput,
  sanitizeURL,
  safeRender,
  validateFileName,
  createSafeFileName,
  safeTruncate,
  validateFormData,
};

export default xssProtection;
