import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductosCrud } from '@/components/productos/ProductosCrud';

export default function ExploreRoute() {
  return (
    <SafeAreaView
      className="flex-1 bg-app-bg"
      style={{ flex: 1, backgroundColor: '#050F1A' }}
      edges={['top', 'bottom']}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ProductosCrud />
    </SafeAreaView>
  );
}
