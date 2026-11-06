import { useCallback, useMemo, useState } from 'react';

export type ValidationRule = {
  /** Función que retorna true si el valor es válido */
  validate: (value: string) => boolean;
  /** Mensaje de error cuando la validación falla */
  message: string;
};

export type FieldValidation = {
  /** Indica si el campo es válido */
  isValid: boolean;
  /** Indica si el usuario ha interactuado con el campo */
  isTouched: boolean;
  /** Mensaje de error (si aplica) */
  error: string | null;
  /** Indica si el campo está siendo validado */
  isValidating: boolean;
};

export type FormValidationState = Record<string, FieldValidation>;

export type ValidationRules = Record<string, ValidationRule[]>;

export function useFormValidation(rules: ValidationRules) {
  const [fieldStates, setFieldStates] = useState<FormValidationState>(() => {
    const initial: FormValidationState = {};
    Object.keys(rules).forEach((field) => {
      initial[field] = {
        isValid: true,
        isTouched: false,
        error: null,
        isValidating: false,
      };
    });
    return initial;
  });

  /**
   * Valida un campo individual aplicando todas sus reglas
   */
  const validateField = useCallback(
    (fieldName: string, value: string): { isValid: boolean; error: string | null } => {
      const fieldRules = rules[fieldName];

      if (!fieldRules || fieldRules.length === 0) {
        return { isValid: true, error: null };
      }

      // Aplicar cada regla
      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          return { isValid: false, error: rule.message };
        }
      }

      return { isValid: true, error: null };
    },
    [rules]
  );

  /**
   * Maneja cambios en un campo (en tiempo real mientras se escribe)
   */
  const handleFieldChange = useCallback(
    (fieldName: string, value: string) => {
      const { isValid, error } = validateField(fieldName, value);

      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          isValid,
          error,
        },
      }));
    },
    [validateField]
  );

  /**
   * Marca un campo como tocado (cuando pierde el foco)
   */
  const handleFieldBlur = useCallback((fieldName: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isTouched: true,
      },
    }));
  }, []);

  /**
   * Marca un campo como no tocado (cuando obtiene el foco)
   */
  const handleFieldFocus = useCallback((fieldName: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isTouched: false,
      },
    }));
  }, []);

  /**
   * Reinicia el estado de validación de un campo específico
   */
  const resetField = useCallback((fieldName: string) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: {
        isValid: true,
        isTouched: false,
        error: null,
        isValidating: false,
      },
    }));
  }, []);

  /**
   * Reinicia todos los campos
   */
  const resetAll = useCallback(() => {
    const initial: FormValidationState = {};
    Object.keys(rules).forEach((field) => {
      initial[field] = {
        isValid: true,
        isTouched: false,
        error: null,
        isValidating: false,
      };
    });
    setFieldStates(initial);
  }, [rules]);

  /**
   * Obtiene el estado de un campo específico
   */
  const getFieldState = useCallback(
    (fieldName: string): FieldValidation => {
      return (
        fieldStates[fieldName] || {
          isValid: true,
          isTouched: false,
          error: null,
          isValidating: false,
        }
      );
    },
    [fieldStates]
  );

  /**
   * Obtiene si el formulario es válido (todos los campos válidos)
   */
  const isFormValid = useMemo(() => {
    return Object.values(fieldStates).every((state) => state.isValid);
  }, [fieldStates]);

  /**
   * Obtiene si el formulario ha sido tocado
   */
  const isFormTouched = useMemo(() => {
    return Object.values(fieldStates).some((state) => state.isTouched);
  }, [fieldStates]);

  /**
   * Retorna todos los errores del formulario
   */
  const getFormErrors = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    Object.entries(fieldStates).forEach(([field, state]) => {
      if (state.error) {
        errors[field] = state.error;
      }
    });
    return errors;
  }, [fieldStates]);

  return {
    // Estados
    fieldStates,
    isFormValid,
    isFormTouched,

    // Handlers
    handleFieldChange,
    handleFieldBlur,
    handleFieldFocus,

    // Métodos
    validateField,
    resetField,
    resetAll,
    getFieldState,
    getFormErrors,
  };
}
