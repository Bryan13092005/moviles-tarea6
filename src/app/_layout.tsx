import '../global.css';

import { Stack } from 'expo-router';
import { AlertProvider } from '@/features/alerts/AlertContext';
import { AlertContainer } from '@/components/ui/AlertContainer';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <AlertProvider>
      <View style={{ flex: 1 }}>
        <Stack />
        <AlertContainer />
      </View>
    </AlertProvider>
  );
}
