import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductosCrud } from '@/components/productos/ProductosCrud';
import { palette } from '@/constants/theme';

export default function ExploreRoute() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ProductosCrud />
    </SafeAreaView>
  );
}
