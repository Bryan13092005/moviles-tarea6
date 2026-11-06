import type { ValidationRule } from './useFormValidation';

/**
 * Reglas de validación predefinidas reutilizables
 */
export const validationRules = {
  // Email
  email: {
    validate: (value: string) => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailPattern.test(value.trim());
    },
    message: 'Escribe un correo electrónico válido',
  } as ValidationRule,

  // Contraseña mínima 6 caracteres
  passwordMin6: {
    validate: (value: string) => value.length >= 6,
    message: 'La contraseña debe tener al menos 6 caracteres',
  } as ValidationRule,

  // Contraseña mínima 8 caracteres
  passwordMin8: {
    validate: (value: string) => value.length >= 8,
    message: 'La contraseña debe tener al menos 8 caracteres',
  } as ValidationRule,

  // Contraseña con mayúscula
  passwordUppercase: {
    validate: (value: string) => /[A-Z]/.test(value),
    message: 'La contraseña debe contener al menos una mayúscula',
  } as ValidationRule,

  // Contraseña con número
  passwordNumber: {
    validate: (value: string) => /[0-9]/.test(value),
    message: 'La contraseña debe contener al menos un número',
  } as ValidationRule,

  // Contraseña con carácter especial
  passwordSpecial: {
    validate: (value: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
    message: 'La contraseña debe contener al menos un carácter especial',
  } as ValidationRule,

  // No vacío
  required: {
    validate: (value: string) => value.trim().length > 0,
    message: 'Este campo es obligatorio',
  } as ValidationRule,

  // Nombre de producto (mínimo 3 caracteres)
  productName: {
    validate: (value: string) => value.trim().length >= 3,
    message: 'El nombre debe tener al menos 3 caracteres',
  } as ValidationRule,

  // Precio válido (número positivo)
  price: {
    validate: (value: string) => {
      if (!value.trim()) return false;
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    message: 'Escribe un precio válido (número positivo)',
  } as ValidationRule,

  // Stock válido (número entero positivo)
  stock: {
    validate: (value: string) => {
      if (!value.trim()) return false;
      const num = Number.parseInt(value, 10);
      return !isNaN(num) && num >= 0;
    },
    message: 'Escribe un stock válido (número entero positivo)',
  } as ValidationRule,

  // Descripción mínima 10 caracteres
  description: {
    validate: (value: string) => value.trim().length >= 10,
    message: 'La descripción debe tener al menos 10 caracteres',
  } as ValidationRule,

  // Teléfono (10-15 dígitos)
  phone: {
    validate: (value: string) => {
      const phonePattern = /^[0-9]{10,15}$/;
      return phonePattern.test(value.replace(/\D/g, ''));
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
        return false;
      }
    },
    message: 'Escribe una URL válida',
  } as ValidationRule,
};

/**
 * Reglas combinadas comunes
 */
export const validationRuleCombinations = {
  // Email para login
  loginEmail: [validationRules.required, validationRules.email],

  // Contraseña para login
  loginPassword: [validationRules.required, validationRules.passwordMin6],

  // Contraseña fuerte (para registro)
  strongPassword: [
    validationRules.required,
    validationRules.passwordMin8,
    validationRules.passwordUppercase,
    validationRules.passwordNumber,
  ],

  // Nombre de producto
  productName: [validationRules.required, validationRules.productName],

  // Precio de producto
  productPrice: [validationRules.required, validationRules.price],

  // Stock de producto
  productStock: [validationRules.required, validationRules.stock],

  // Descripción de producto
  productDescription: [validationRules.required, validationRules.description],
};
