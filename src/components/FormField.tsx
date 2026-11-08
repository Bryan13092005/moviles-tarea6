import { useState } from 'react';
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
  /** Número máximo de caracteres */
  maxLength?: number;
  /** Número de líneas (para textarea) */
  numberOfLines?: number;
  /** Deshabilitar edición */
  editable?: boolean;
  /** Si debe mostrar mensaje de éxito */
  showSuccessMessage?: boolean;
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
  editable = true,
  showSuccessMessage = false,
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { error, isTouched, isValid } = validation;

  const showError = Boolean(isTouched && error);
  const showSuccess = Boolean(isTouched && isValid && !error && value.trim().length > 0);

  // Determinar color del borde basado en validación y foco
  const getBorderColor = () => {
    if (showError) return palette.danger;
    if (showSuccess) return palette.green;
    if (isFocused) return palette.green;
    return palette.navyLine;
  };

  const borderColor = getBorderColor();

  return (
    <View style={{ marginBottom: 14 }}>
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
          backgroundColor: isFocused ? palette.navySoft : palette.navy,
          paddingHorizontal: 16,
          paddingVertical: numberOfLines && numberOfLines > 1 ? 12 : 0,
          flexDirection: numberOfLines && numberOfLines > 1 ? 'column' : 'row',
          alignItems: numberOfLines && numberOfLines > 1 ? 'flex-start' : 'center',
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          placeholder={placeholder}
          placeholderTextColor={palette.textDim}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          numberOfLines={numberOfLines}
          multiline={Boolean(numberOfLines && numberOfLines > 1)}
          editable={editable}
          selectionColor={palette.green}
          keyboardAppearance="dark"
          style={{
            fontSize: 15,
            letterSpacing: 0.1,
            color: palette.text,
            flex: 1,
            height: numberOfLines && numberOfLines > 1 ? numberOfLines * 22 : 54,
            padding: 0,
            textAlignVertical: numberOfLines && numberOfLines > 1 ? 'top' : 'center',
          }}
        />

        {/* Indicador de estado al escribir */}
        {isTouched && value.length > 0 && (!numberOfLines || numberOfLines <= 1) && (
          <View
            style={{
              marginLeft: 12,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: showError ? 'rgba(255, 154, 154, 0.15)' : 'rgba(47, 214, 139, 0.15)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: 'bold',
                color: showError ? palette.danger : palette.green,
              }}
            >
              {showError ? '✕' : '✓'}
            </Text>
          </View>
        )}
      </View>

      {/* Error Message debajo del campo */}
      {showError && (
        <Text
          style={{
            fontSize: 12,
            color: palette.danger,
            marginTop: 6,
            fontWeight: '500',
            lineHeight: 16,
          }}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}

      {/* Success Message opcional */}
      {showSuccessMessage && showSuccess && (
        <Text
          style={{
            fontSize: 12,
            color: palette.green,
            marginTop: 6,
            fontWeight: '500',
            lineHeight: 16,
          }}
        >
          ✓ Correcto
        </Text>
      )}
    </View>
  );
}
