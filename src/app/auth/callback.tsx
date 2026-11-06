import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { loginPalette } from '@/components/login-screen';
import { completeGoogleSignIn } from '@/features/auth/googleAuth';
import { supabase } from '@/db/supabase';

function hasAuthParams(url: string): boolean {
  return /[?#&](code|access_token|error|error_code)=/.test(url);
}

function buildUrlFromParams(params: Record<string, string | string[] | undefined>): string | null {
  const entries = Object.entries(params).flatMap(([key, value]) => {
    if (value == null) return [] as [string, string][];
    const v = Array.isArray(value) ? value[0] : value;
    return v ? ([[key, v]] as [string, string][]) : ([] as [string, string][]);
  });
  if (entries.length === 0) return null;
  const search = new URLSearchParams(entries).toString();
  if (!/[?&](code|access_token|error|error_code)=/.test(`?${search}`)) return null;
  return `tarea6://auth/callback?${search}`;
}

async function goToProductsIfSignedIn(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) {
    router.replace('/explore');
    return true;
  }
  return false;
}

export default function AuthCallbackRoute() {
  const linkingUrl = Linking.useLinkingURL();
  const params = useLocalSearchParams<Record<string, string>>();
  const paramUrl = useMemo(() => buildUrlFromParams(params), [params]);
  const processedUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let settled = false;

    const done = () => {
      settled = true;
      if (!cancelled) setBusy(false);
    };

    const fail = async (callbackError: unknown) => {
      if (cancelled) return;
      const signedIn = await goToProductsIfSignedIn().catch(() => false);
      if (signedIn || cancelled) return;
      setError(
        callbackError instanceof Error
          ? callbackError.message
          : 'No se pudo completar el inicio de sesión.',
      );
      done();
    };

    const finish = async (url: string) => {
      if (cancelled || settled || processedUrl.current === url) return;
      processedUrl.current = url;
      try {
        await completeGoogleSignIn(url);
        if (!cancelled) router.replace('/explore');
      } catch (callbackError: unknown) {
        await fail(callbackError);
      }
    };

    const run = async () => {
      if (paramUrl) return finish(paramUrl);

      if (linkingUrl && hasAuthParams(linkingUrl)) return finish(linkingUrl);

      const initial = await Linking.getInitialURL().catch(() => null);
      if (!cancelled && initial && hasAuthParams(initial)) return finish(initial);

      if (await goToProductsIfSignedIn().catch(() => false)) return;

      await new Promise((r) => setTimeout(r, 1800));
      if (cancelled || settled) return;
      if (await goToProductsIfSignedIn().catch(() => false)) return;

      const lateUrl = (await Linking.getInitialURL().catch(() => null)) ?? linkingUrl;
      if (!cancelled && lateUrl && hasAuthParams(lateUrl) && processedUrl.current !== lateUrl) {
        return finish(lateUrl);
      }

      if (!cancelled) {
        setError('No se recibieron credenciales de inicio de sesión. Vuelve a intentarlo.');
        done();
      }
    };

    void run().catch((e) => void fail(e));
    return () => {
      cancelled = true;
    };
  }, [linkingUrl, paramUrl]);

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
            {!busy ? null : null}
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
