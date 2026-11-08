import type { ValidationRule } from './useFormValidation';

/**
 * Función detallada de validación de correo en tiempo real.
 * Verifica estrictamente la presencia y posición de '@' y '.' mientras el usuario escribe.
 */
export function validateEmailDetailed(value: string): boolean | string {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'El correo electrónico es obligatorio';
  }

  const hasAt = trimmed.includes('@');
  const hasDot = trimmed.includes('.');

  // 1. Falta tanto '@' como '.'
  if (!hasAt && !hasDot) {
    return "El correo debe incluir un '@' y un punto '.' (ej. usuario@dominio.com)";
  }

  // 2. Falta '@'
  if (!hasAt) {
    return "El correo debe incluir el símbolo '@' (ej. usuario@dominio.com)";
  }

  // 3. No más de un '@'
  const parts = trimmed.split('@');
  if (parts.length > 2) {
    return "El correo no puede contener más de un símbolo '@'";
  }

  const [localPart, domainPart] = parts;

  // 4. Parte antes del '@'
  if (!localPart || localPart.length === 0) {
    return "Falta el nombre de usuario antes del '@' (ej. usuario@...)";
  }

  // 5. Falta '.' o está en la parte local pero no en el dominio
  if (!domainPart || !domainPart.includes('.')) {
    return "El correo debe incluir un punto '.' después del '@' (ej. .com)";
  }

  // 6. Verificar estructura del dominio (dominio.extensión)
  const domainParts = domainPart.split('.');
  const domainName = domainParts[0];
  const tld = domainParts[domainParts.length - 1];

  if (!domainName || domainName.length === 0) {
    return "Falta el nombre del dominio después del '@' (ej. @gmail.com)";
  }

  if (!tld || tld.length < 2) {
    return "Falta la extensión del dominio después del punto (ej. .com)";
  }

  // 7. Caracteres permitidos y formato estándar
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailPattern.test(trimmed)) {
    return 'Escribe un correo electrónico válido (ej. usuario@dominio.com)';
  }

  return true;
}

/**
 * Reglas de validación predefinidas reutilizables
 */
export const validationRules = {
  // Email en tiempo real con verificación de @ y .
  email: {
    validate: validateEmailDetailed,
    message: "El correo debe incluir '@' y un punto '.' válido",
  } as ValidationRule,

  // Contraseña mínima 6 caracteres
  passwordMin6: {
    validate: (value: string) => {
      if (!value) return 'La contraseña es obligatoria';
      if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      return true;
    },
    message: 'La contraseña debe tener al menos 6 caracteres',
  } as ValidationRule,

  // Contraseña mínima 8 caracteres
  passwordMin8: {
    validate: (value: string) => {
      if (!value) return 'La contraseña es obligatoria';
      if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
      return true;
    },
    message: 'La contraseña debe tener al menos 8 caracteres',
  } as ValidationRule,

  // Contraseña con mayúscula
  passwordUppercase: {
    validate: (value: string) =>
      /[A-Z]/.test(value) || 'La contraseña debe contener al menos una letra mayúscula',
    message: 'La contraseña debe contener al menos una mayúscula',
  } as ValidationRule,

  // Contraseña con número
  passwordNumber: {
    validate: (value: string) =>
      /[0-9]/.test(value) || 'La contraseña debe contener al menos un número',
    message: 'La contraseña debe contener al menos un número',
  } as ValidationRule,

  // Contraseña con carácter especial
  passwordSpecial: {
    validate: (value: string) =>
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value) ||
      'La contraseña debe contener al menos un carácter especial',
    message: 'La contraseña debe contener al menos un carácter especial',
  } as ValidationRule,

  // Campo obligatorio genérico
  required: {
    validate: (value: string) =>
      value.trim().length > 0 || 'Este campo es obligatorio',
    message: 'Este campo es obligatorio',
  } as ValidationRule,

  // Nombre de producto (mínimo 3 caracteres, obligatorio)
  productName: {
    validate: (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return 'El nombre del producto es obligatorio';
      if (trimmed.length < 3) return 'El nombre debe tener al menos 3 caracteres';
      if (trimmed.length > 80) return 'El nombre no puede tener más de 80 caracteres';
      return true;
    },
    message: 'El nombre debe tener al menos 3 caracteres',
  } as ValidationRule,

  // Precio válido (número positivo, máx 2 decimales)
  price: {
    validate: (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return 'El precio es obligatorio';
      const normalized = trimmed.replace(',', '.');
      const num = Number(normalized);
      if (isNaN(num)) return 'Ingresa un número válido para el precio (ej. 19.99)';
      if (num <= 0) return 'El precio debe ser un número mayor a 0';
      if (normalized.includes('.')) {
        const decimals = normalized.split('.')[1];
        if (decimals && decimals.length > 2) {
          return 'El precio no puede tener más de 2 decimales';
        }
      }
      return true;
    },
    message: 'Escribe un precio válido (número positivo)',
  } as ValidationRule,

  // Stock válido (número entero mayor o igual a 0)
  stock: {
    validate: (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return 'El stock es obligatorio';
      if (trimmed.includes('.') || trimmed.includes(',')) {
        return 'El stock debe ser un número entero (sin decimales)';
      }
      const num = Number(trimmed);
      if (isNaN(num) || !Number.isInteger(num)) {
        return 'Ingresa un número entero válido (ej. 10)';
      }
      if (num < 0) return 'El stock no puede ser negativo';
      return true;
    },
    message: 'Escribe un stock válido (número entero positivo)',
  } as ValidationRule,

  // Descripción opcional con límite
  description: {
    validate: (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return true; // Es opcional
      if (trimmed.length > 500) {
        return 'La descripción no puede tener más de 500 caracteres';
      }
      return true;
    },
    message: 'La descripción no es válida',
  } as ValidationRule,

  // Teléfono (10-15 dígitos)
  phone: {
    validate: (value: string) => {
      const phonePattern = /^[0-9]{10,15}$/;
      return phonePattern.test(value.replace(/\D/g, '')) || 'Escribe un número de teléfono válido (10 a 15 dígitos)';
    },
    message: 'Escribe un número de teléfono válido',
  } as ValidationRule,

  // URL válida
  url: {
    validate: (value: string) => {
      try {
        new URL(value);
        return true;
      } catch {
        return 'Escribe una URL válida';
      }
    },
    message: 'Escribe una URL válida',
  } as ValidationRule,
};

/**
 * Reglas combinadas comunes
 */
export const validationRuleCombinations = {
  // Email para login y formularios
  loginEmail: [validationRules.email],

  // Contraseña para login
  loginPassword: [validationRules.passwordMin6],

  // Contraseña fuerte (para registro)
  strongPassword: [
    validationRules.passwordMin8,
    validationRules.passwordUppercase,
    validationRules.passwordNumber,
  ],

  // Nombre de producto
  productName: [validationRules.productName],

  // Precio de producto
  productPrice: [validationRules.price],

  // Stock de producto
  productStock: [validationRules.stock],

  // Descripción de producto
  productDescription: [validationRules.description],
};
