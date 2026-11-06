import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View, Animated, Dimensions } from 'react-native';

import { palette } from '@/constants/theme';
import { animaciones, type AnimacionId } from './animaciones';

type EstiloAlerta = {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  iconColor?: string;
};

const ESTILOS_ALERTA: Record<'success' | 'error' | 'info' | 'warning', EstiloAlerta> = {
  success: {
    borderColor: 'rgba(47,214,139,0.32)',
    backgroundColor: 'rgba(12,59,42,0.95)',
    textColor: palette.greenLight,
    iconColor: palette.green,
  },
  error: {
    borderColor: 'rgba(255,154,154,0.32)',
    backgroundColor: 'rgba(52,19,28,0.95)',
    textColor: palette.danger,
    iconColor: palette.danger,
  },
  info: {
    borderColor: 'rgba(18,104,168,0.32)',
    backgroundColor: 'rgba(9,27,43,0.95)',
    textColor: palette.greenLight,
    iconColor: palette.blueGlow,
  },
  warning: {
    borderColor: 'rgba(255,200,100,0.32)',
    backgroundColor: 'rgba(50,40,20,0.95)',
    textColor: '#FFD700',
    iconColor: '#FFD700',
  },
};

type LottieAlertProps = {
  /** Controla si la alerta se muestra. */
  visible?: boolean;
  /** Tipo de alerta: define los colores de la paleta. */
  type?: 'success' | 'error' | 'info' | 'warning';
  /** Mensaje de la alerta. */
  message: string;
  /** Identificador de la animación en assets/animations. */
  animation: AnimacionId;
  /** Muestra botón para cerrar manualmente. */
  closable?: boolean;
  /** Se ejecuta al ocultarse. */
  onDismiss?: () => void;
  /** Versión fullscreen o flotante. */
  isFullScreen?: boolean;
  /** Tamaño de la animación. */
  animationSize?: number;
};

export function LottieAlert({
  visible = true,
  type = 'success',
  message,
  animation,
  closable = false,
  onDismiss,
  isFullScreen = false,
  animationSize = 20,
}: LottieAlertProps) {
  const estilo = ESTILOS_ALERTA[type];
  const Source = animaciones[animation];
  const screenHeight = Dimensions.get('window').height;
  const [slideAnim] = useState(
    () =>
      new Animated.Value(isFullScreen ? 0 : screenHeight)
  );

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const presionarCerrar = () => {
    Animated.timing(slideAnim, {
      toValue: isFullScreen ? 0 : screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  if (isFullScreen) {
    return (
      <Animated.View
        style={{
          transform: [{ translateY: slideAnim }],
          flex: 1,
          backgroundColor: palette.navy,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}
        accessibilityLiveRegion="polite"
      >
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <LottieView source={Source} autoPlay loop={false} style={{ width: 120, height: 120 }} />
        </View>

        <Text
          style={{
            color: estilo.textColor,
            fontSize: 24,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 12,
          }}
        >
          {message.split('\n')[0]}
        </Text>

        {message.split('\n').length > 1 && (
          <Text
            style={{
              color: palette.textMuted,
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            {message.split('\n').slice(1).join('\n')}
          </Text>
        )}

        {closable && (
          <Pressable
            onPress={presionarCerrar}
            style={{
              paddingHorizontal: 32,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: estilo.backgroundColor,
              borderWidth: 1,
              borderColor: estilo.borderColor,
            }}
          >
            <Text style={{ color: estilo.textColor, fontWeight: '600', fontSize: 14 }}>
              Entendido
            </Text>
          </Pressable>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        marginBottom: 12,
        marginHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
      accessibilityLiveRegion="polite"
    >
      <View
        style={{
          flexDirection: 'column',
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderColor: estilo.borderColor,
          backgroundColor: estilo.backgroundColor,
          borderWidth: 1.5,
        }}
      >
        {/* Animación grande en la parte superior */}
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              width: 80,
              height: 80,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LottieView
              source={Source}
              autoPlay
              loop={false}
              style={{ width: 64, height: 64 }}
            />
          </View>
        </View>

        {/* Texto del mensaje */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: estilo.textColor,
              fontSize: 14,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 6,
              lineHeight: 20,
            }}
          >
            {message.split('\n')[0]}
          </Text>

          {message.split('\n').length > 1 && (
            <Text
              style={{
                color: palette.textMuted,
                fontSize: 12,
                textAlign: 'center',
                lineHeight: 18,
              }}
            >
              {message.split('\n').slice(1).join('\n')}
            </Text>
          )}
        </View>

        {/* Botón cerrar en la parte inferior */}
        {closable && (
          <Pressable
            onPress={presionarCerrar}
            style={{
              marginTop: 12,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderWidth: 1,
              borderColor: estilo.borderColor,
            }}
          >
            <Text
              style={{
                color: estilo.textColor,
                fontWeight: '600',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              Entendido
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
