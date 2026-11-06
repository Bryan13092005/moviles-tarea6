import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="flex-1 justify-end bg-[rgba(5,15,26,0.78)]">
          <Pressable
            className="absolute inset-0"
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar modal"
          />
          <SafeAreaView edges={['bottom']} className="w-full" style={{ width: '100%' }}>
            <View className="max-h-[92%] overflow-hidden rounded-t-[26px] border border-[rgba(24,56,80,0.9)] bg-[#081A2B]">
              <View className="flex-row items-center justify-between border-b border-[rgba(143,168,186,0.12)] px-5 pt-[18px] pb-3">
                <Text className="text-[18px] font-extrabold tracking-[-0.3px] text-[#F2F8F5]">{title}</Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                >
                  <Text className="p-1 text-[18px] font-bold text-[#8FA8BA]">✕</Text>
                </Pressable>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, gap: 14 }}
              >
                {children}
              </ScrollView>
              {footer ? (
                <View className="gap-[10px] border-t border-[rgba(143,168,186,0.12)] p-5 pt-3">{footer}</View>
              ) : null}
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
