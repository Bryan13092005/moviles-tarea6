import { useCallback, useMemo, useState } from 'react';

export type ValidationRule = {
  /** Función que retorna true si el valor es válido, false o un string de error si falla */
  validate: (value: string) => boolean | string;
  /** Mensaje de error por defecto cuando la validación retorna false */
  message?: string;
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

      // Aplicar cada regla en orden
      for (const rule of fieldRules) {
        const result = rule.validate(value);
        if (result === false) {
          return { isValid: false, error: rule.message || 'Valor no válido' };
        }
        if (typeof result === 'string') {
          return { isValid: false, error: result };
        }
      }

      return { isValid: true, error: null };
    },
    [rules]
  );

  /**
   * Maneja cambios en un campo (en tiempo real mientras se escribe)
   * Marca el campo como tocado para mostrar la validación inmediatamente
   */
  const handleFieldChange = useCallback(
    (fieldName: string, value: string): { isValid: boolean; error: string | null } => {
      const { isValid, error } = validateField(fieldName, value);

      setFieldStates((prev) => ({
        ...prev,
        [fieldName]: {
          isValid,
          isTouched: true,
          error,
          isValidating: false,
        },
      }));

      return { isValid, error };
    },
    [validateField]
  );

  /**
   * Marca un campo como tocado (cuando pierde el foco o se solicita)
   */
  const handleFieldBlur = useCallback(
    (fieldName: string, value?: string) => {
      setFieldStates((prev) => {
        const current = prev[fieldName] ?? {
          isValid: true,
          isTouched: false,
          error: null,
          isValidating: false,
        };

        if (value !== undefined) {
          const { isValid, error } = validateField(fieldName, value);
          return {
            ...prev,
            [fieldName]: {
              isValid,
              isTouched: true,
              error,
              isValidating: false,
            },
          };
        }

        return {
          ...prev,
          [fieldName]: {
            ...current,
            isTouched: true,
          },
        };
      });
    },
    [validateField]
  );

  /**
   * Marca un campo como enfocado
   */
  const handleFieldFocus = useCallback((fieldName: string) => {
    setFieldStates((prev) => {
      const current = prev[fieldName];
      if (!current) return prev;
      return {
        ...prev,
        [fieldName]: {
          ...current,
          isValidating: true,
        },
      };
    });
  }, []);

  /**
   * Valida todos los campos del formulario de golpe (útil para el submit)
   * Marca todos los campos como tocados para que sus errores se muestren
   */
  const validateAll = useCallback(
    (values: Record<string, string>): boolean => {
      let allValid = true;
      const nextStates: FormValidationState = {};

      Object.keys(rules).forEach((field) => {
        const val = values[field] ?? '';
        const { isValid, error } = validateField(field, val);
        if (!isValid) {
          allValid = false;
        }
        nextStates[field] = {
          isValid,
          isTouched: true,
          error,
          isValidating: false,
        };
      });

      setFieldStates((prev) => ({
        ...prev,
        ...nextStates,
      }));

      return allValid;
    },
    [rules, validateField]
  );

  /**
   * Asigna un error manualmente a un campo
   */
  const setFieldError = useCallback((fieldName: string, error: string | null) => {
    setFieldStates((prev) => ({
      ...prev,
      [fieldName]: {
        isValid: error === null,
        isTouched: true,
        error,
        isValidating: false,
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
    validateAll,
    setFieldError,
    resetField,
    resetAll,
    getFieldState,
    getFormErrors,
  };
}
