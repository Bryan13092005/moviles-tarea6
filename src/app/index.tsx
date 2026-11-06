import { Stack } from 'expo-router';

import { LoginScreen } from '@/components/login-screen';

export default function IndexRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen />
    </>
  );
}
