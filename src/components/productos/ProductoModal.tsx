import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/constants/theme';

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function ProductoModal({ visible, title, onClose, children, footer }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar modal" />
          <SafeAreaView edges={['bottom']} style={styles.safe}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
                  <Text style={styles.close}>✕</Text>
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
              >
                {children}
              </ScrollView>
              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function useProductoModal() {
  const [visible, setVisible] = useState(false);
  return {
    visible,
    open: () => setVisible(true),
    close: () => setVisible(false),
  };
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 26, 0.78)',
    justifyContent: 'flex-end',
  },
  safe: { width: '100%' },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(24, 56, 80, 0.9)',
    backgroundColor: palette.navy,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(143, 168, 186, 0.12)',
  },
  title: { color: palette.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  close: { color: palette.textMuted, fontSize: 18, fontWeight: '700', padding: 4 },
  content: { padding: 20, gap: 14 },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(143, 168, 186, 0.12)',
    gap: 10,
  },
});
