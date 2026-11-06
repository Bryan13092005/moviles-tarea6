import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { palette } from '@/constants/theme';

type GoogleButtonProps = {
  /** Texto del botón. */
  label: string;
  /** Acción al presionar. */
  onPress: () => void;
  /** Mientras está ocupado se muestra un indicador y se bloquea el botón. */
  busy?: boolean;
  /** Deshabilita el botón. */
  disabled?: boolean;
  /** Clases de estilo adicionales del contenedor. */
  className?: string;
};

export function GoogleButton({
  label,
  onPress,
  busy = false,
  disabled = false,
  className,
}: GoogleButtonProps) {
  const lottie = useRef<LottieView>(null);

  const reproducir = useCallback(() => {
    lottie.current?.reset();
    lottie.current?.play();
  }, []);

  const presionar = useCallback(() => {
    if (busy || disabled) return;
    reproducir();
    onPress();
  }, [busy, disabled, onPress, reproducir]);

  if (busy) {
    return (
      <Pressable
        disabled
        onPress={presionar}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={`flex-row items-center justify-center gap-2 ${className ?? ''}`}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 17,
            backgroundColor: palette.white,
          }}
        >
          <ActivityIndicator color="#1F2937" />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={presionar}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`flex-row items-center justify-center gap-2 ${className ?? ''}`}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 17,
          backgroundColor: palette.white,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Text style={{ color: '#1F2937', fontWeight: '700', fontSize: 14 }}>G</Text>
        <Text style={{ color: '#1F2937', fontWeight: '800', fontSize: 15 }}>{label}</Text>
      </View>
    </Pressable>
  );
}
