import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

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
      <View
        className="flex-1 items-center justify-center gap-4 bg-app-bg px-7"
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050F1A', paddingHorizontal: 28 }}
      >
        {error ? (
          <>
            <Text className="text-center text-[18px] font-bold text-app-text">
              No se pudo completar el acceso
            </Text>
            <Text className="text-center text-[14px] leading-5 text-app-text-muted">{error}</Text>
            <Pressable
              onPress={() => router.replace('/')}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio de sesión"
              className="mt-2 rounded-[14px] bg-app-green-light px-6 py-3"
            >
              <Text className="text-[14px] font-bold text-app-green-deep">Volver</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator color="#A8F2C9" />
            <Text className="text-center text-[14px] leading-5 text-app-text-muted">
              Completando el inicio de sesión…
            </Text>
            {!busy ? null : null}
          </>
        )}
      </View>
    </>
  );
}
