import LottieView from 'lottie-react-native';
import { useCallback, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { animaciones, type AnimacionId } from './animaciones';

const ESTILOS_VARIANTE: Record<
  'primario' | 'peligro',
  { fondo: string; fondoPresionado: string; texto: string }
> = {
  primario: {
    fondo: '#A8F2C9',
    fondoPresionado: '#2FD68B',
    texto: '#072A1E',
  },
  peligro: {
    fondo: 'rgba(52,19,28,0.45)',
    fondoPresionado: '#34131C',
    texto: '#FF9A9A',
  },
};

type LottieButtonProps = {
  /** Identificador de la animación en assets/animations. */
  animation: AnimacionId;
  /** Texto del botón. */
  label: string;
  /** Acción al presionar. */
  onPress: () => void;
  /** Variante de color de la paleta. */
  variant?: 'primario' | 'peligro';
  /** Versión compacta para enlaces de acción. */
  compact?: boolean;
  /** Mientras está ocupado se muestra un indicador y se bloquea el botón. */
  busy?: boolean;
  /** Deshabilita el botón. */
  disabled?: boolean;
  /** Clases de estilo adicionales del contenedor. */
  className?: string;
};

export function LottieButton({
  animation,
  label,
  onPress,
  variant = 'primario',
  compact = false,
  busy = false,
  disabled = false,
  className,
}: LottieButtonProps) {
  const lottie = useRef<LottieView>(null);
  const estilo = ESTILOS_VARIANTE[variant];

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
        <ActivityIndicator color={estilo.texto} />
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
          gap: 6,
          paddingVertical: compact ? 8 : 14,
          paddingHorizontal: 16,
          borderRadius: 17,
          backgroundColor: estilo.fondo,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <LottieView
          ref={lottie}
          source={animaciones[animation]}
          autoPlay
          loop={false}
          style={{ width: 20, height: 20 }}
        />
        <Text style={{ color: estilo.texto, fontWeight: '800', fontSize: 15 }}>{label}</Text>
      </View>
    </Pressable>
  );
}
