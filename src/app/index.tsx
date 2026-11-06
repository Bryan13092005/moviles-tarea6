import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { LoginScreen, loginPalette } from '@/components/login-screen';
import { auth } from '@/features/auth/supabaseAuth';

export default function IndexRoute() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const { data } = await auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        router.replace('/explore');
        return;
      }
      setChecking(false);
    };
    void run();

    const { data: sub } = auth.onAuthStateChange((_event, session) => {
      if (session?.user) router.replace('/explore');
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: loginPalette.background,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={loginPalette.greenLight} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen onSignedIn={() => router.replace('/explore')} />
    </>
  );
}
