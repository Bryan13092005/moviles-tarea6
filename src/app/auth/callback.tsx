import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { loginPalette } from '@/components/login-screen';
import { completeGoogleSignIn } from '@/features/auth/googleAuth';

/** Detecta si la URL trae credenciales de Supabase (`?code=` o `#access_token=`). */
function hasAuthParams(url: string): boolean {
  return /[?#&](code|access_token|error|error_code)=/.test(url);
}

/**
 * Destino del deep link `…/auth/callback` que se envía a Supabase como
 * `redirectTo`.
 *
 * Sirve para dos casos que `signInWithGoogle` no cubre por sí solo:
 * - **Web**: el navegador navega a `/auth/callback#access_token=…` y esta ruta
 *   es la que crea la sesión.
 * - **Nativo**: si el sistema abre la app por su cuenta (app cerrada, Expo Go,
 *   etc.), el deep link llega aquí en lugar de al `openAuthSessionAsync`.
 */
export default function AuthCallbackRoute() {
  const linkingUrl = Linking.useLinkingURL();
  const processedUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!linkingUrl || processedUrl.current === linkingUrl) return;
    if (!hasAuthParams(linkingUrl)) return;

    processedUrl.current = linkingUrl;

    let cancelled = false;

    completeGoogleSignIn(linkingUrl)
      .then(() => {
        if (!cancelled) router.replace('/');
      })
      .catch((callbackError: unknown) => {
        if (cancelled) return;
        setError(
          callbackError instanceof Error
            ? callbackError.message
            : 'No se pudo completar el inicio de sesión.',
        );
      });

    return () => {
      cancelled = true;
    };
  }, [linkingUrl]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.screen}>
        {error ? (
          <>
            <Text style={styles.title}>No se pudo completar el acceso</Text>
            <Text style={styles.message}>{error}</Text>
            <Pressable
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio de sesión"
              style={styles.button}
            >
              <Text style={styles.buttonText}>Volver</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color={loginPalette.greenLight} />
            <Text style={styles.message}>Completando el inicio de sesión…</Text>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 28,
    backgroundColor: loginPalette.background,
  },
  title: {
    color: loginPalette.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    color: loginPalette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: loginPalette.greenLight,
  },
  buttonText: {
    color: loginPalette.greenDeep,
    fontSize: 14,
    fontWeight: '700',
  },
});
