import { Text, View, TextInput } from 'react-native';
import { palette } from '@/constants/theme';
import type { FieldValidation } from '@/features/validation/useFormValidation';

type FormFieldProps = {
  /** Label del campo */
  label: string;
  /** Valor actual del campo */
  value: string;
  /** Placeholder */
  placeholder?: string;
  /** Callback cuando cambia el valor */
  onChangeText: (text: string) => void;
  /** Callback cuando el campo pierde foco */
  onBlur?: () => void;
  /** Callback cuando el campo obtiene foco */
  onFocus?: () => void;
  /** Estado de validación del campo */
  validation: FieldValidation;
  /** Tipo de input */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad' | 'phone-pad';
  /** Si es contraseña */
  secureTextEntry?: boolean;
  /** Número máximo de líneas (para TextInput multiline) */
  maxLength?: number;
  /** Número de líneas (para textarea) */
  numberOfLines?: number;
};

export function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  onBlur,
  onFocus,
  validation,
  keyboardType = 'default',
  secureTextEntry = false,
  maxLength,
  numberOfLines,
}: FormFieldProps) {
  const { error, isTouched, isValid } = validation;

  // Mostrar error solo si el campo ha sido tocado y hay error
  const showError = isTouched && error;

  // Determinar color del borde basado en validación
  const getBorderColor = () => {
    if (!isTouched) return palette.navyLine; // Gris por defecto
    if (isValid) return palette.green; // Verde si es válido
    return palette.danger; // Rojo si hay error
  };

  const borderColor = getBorderColor();

  return (
    <View style={{ marginBottom: 16 }}>
      {/* Label */}
      <Text
        style={{
          fontSize: 9,
          fontWeight: 'bold',
          letterSpacing: 1.6,
          color: palette.textMuted,
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>

      {/* Input Container */}
      <View
        style={{
          borderRadius: 15,
          borderWidth: 1,
          borderColor,
          backgroundColor: palette.navySoft,
          paddingHorizontal: 16,
          paddingVertical: numberOfLines ? 12 : 0,
          flexDirection: numberOfLines ? 'column' : 'row',
          alignItems: numberOfLines ? 'flex-start' : 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={palette.textDim}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          numberOfLines={numberOfLines}
          multiline={numberOfLines ? numberOfLines > 1 : false}
          editable={true}
          style={{
            fontSize: 15,
            letterSpacing: 0.1,
            color: palette.text,
            flex: 1,
            height: numberOfLines ? numberOfLines * 20 : 54,
            padding: 0,
          }}
        />

        {/* Indicador de validación */}
        {isTouched && (
          <View
            style={{
              marginLeft: 12,
              width: 20,
              height: 20,
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: isValid ? palette.green : palette.danger,
              }}
            >
              {isValid ? '✓' : '✗'}
            </Text>
          </View>
        )}
      </View>

      {/* Error Message */}
      {showError && (
        <Text
          style={{
            fontSize: 12,
            color: palette.danger,
            marginTop: 6,
            fontWeight: '500',
          }}
        >
          {error}
        </Text>
      )}

      {/* Success Message (solo si es válido y tocado) */}
      {isTouched && isValid && !error && (
        <Text
          style={{
            fontSize: 12,
            color: palette.green,
            marginTop: 6,
            fontWeight: '500',
          }}
        >
          ✓ Correcto
        </Text>
      )}
    </View>
  );
}
