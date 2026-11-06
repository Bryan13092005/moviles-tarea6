import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import type { Producto } from '@/features/productos/productos.types';

const AnimatedView = withUniwind(Animated.View);

type Props = {
  producto: Producto;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  busy?: boolean;
  index?: number;
};

function formatPrice(value: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${value.toFixed(2)}`;
}

const cardShadow = {
  shadowColor: '#1268A8',
  shadowOpacity: 0.22,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
  flexDirection: 'row' as const,
  gap: 14,
  padding: 14,
  borderRadius: 22,
  borderWidth: 1,
  borderColor: 'rgba(47, 214, 139, 0.18)',
  backgroundColor: 'rgba(8, 26, 43, 0.97)',
  overflow: 'hidden' as const,
};

export function ProductoCard({ producto, onEdit, onDelete, busy, index = 0 }: Props) {
  const lowStock = producto.stock != null && producto.stock <= 5;

  return (
    <AnimatedView
      entering={FadeInDown.delay(Math.min(index, 10) * 70)
        .duration(420)
        .springify()
        .damping(18)}
      className="flex-row gap-3.5 rounded-[22px] border border-[rgba(47,214,139,0.18)] bg-[rgba(8,26,43,0.97)] p-3.5 overflow-hidden"
      style={cardShadow}
    >
      <View
        pointerEvents="none"
        className="absolute -right-7.5 -top-10 h-35 w-35 rounded-full bg-[rgba(18,104,168,0.16)]"
      />
      <View
        pointerEvents="none"
        className="absolute left-0 top-4.5 bottom-4.5 w-0.75 rounded-full bg-app-green opacity-[0.85]"
      />

      <View className="items-center gap-2">
        <View className="rounded-[18px] bg-[rgba(47,214,139,0.22)] p-0.5">
          <View className="h-23.5 w-23.5 overflow-hidden rounded-2xl border border-[rgba(168,242,201,0.18)] bg-app-navy-soft">
            {producto.img ? (
              <Image source={{ uri: producto.img }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <View className="flex-1 items-center justify-center bg-app-navy">
                <View className="h-10.5 w-10.5 items-center justify-center rounded-xl border border-app-navy-line bg-[rgba(12,34,54,0.9)]">
                  <Text className="text-[10px] font-extrabold tracking-[1.2px] text-app-text-dim">IMG</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <View className="max-w-24.5 rounded-full border border-[rgba(168,242,201,0.28)] bg-[rgba(12,59,42,0.72)] px-2.5 py-1.25">
          <Text className="text-center text-[13px] font-extrabold text-app-green-light">{formatPrice(producto.precio)}</Text>
        </View>
      </View>

      <View className="min-w-0 flex-1 pt-0.5">
        <Text className="text-[16px] font-extrabold leading-5.25 tracking-[-0.2px] text-app-text" numberOfLines={2}>
          {producto.nombre?.trim() || 'Sin nombre'}
        </Text>

        <View className="mt-2 flex-row flex-wrap gap-2">
          {producto.stock != null ? (
            <View
              className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1.25 ${
                lowStock
                  ? 'border-[rgba(255,154,154,0.22)] bg-[rgba(52,19,28,0.35)]'
                  : 'border-[rgba(143,168,186,0.18)] bg-[rgba(12,34,54,0.7)]'
              }`}
            >
              <View className={`h-1.5 w-1.5 rounded-full ${lowStock ? 'bg-app-danger' : 'bg-app-green'}`} />
              <Text className={`text-[11px] font-bold ${lowStock ? 'text-app-danger' : 'text-app-text-muted'}`}>
                {producto.stock} en stock
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-1.5 rounded-full border border-[rgba(143,168,186,0.18)] bg-[rgba(12,34,54,0.7)] px-2.5 py-1.25">
              <Text className="text-[11px] font-bold text-app-text-muted">Stock —</Text>
            </View>
          )}
        </View>

        <View className="mt-3 flex-row gap-2">
          <Pressable
            onPress={() => onEdit(producto)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Actualizar ${producto.nombre ?? 'producto'}`}
            className="min-h-9.5 flex-1"
          >
            {({ pressed }) => (
              <View
                className={`min-h-9.5 w-full items-center justify-center rounded-xl border px-3.25 ${
                  pressed && !busy
                    ? 'border-[rgba(47,214,139,0.55)] bg-[rgba(12,59,42,0.45)]'
                    : 'border-[rgba(168,242,201,0.22)] bg-[rgba(12,34,54,0.95)]'
                } ${busy ? 'opacity-[0.55]' : ''}`}
              >
                <Text className="text-[12px] font-extrabold tracking-[0.2px] text-app-green-light">Actualizar</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => onDelete(producto)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${producto.nombre ?? 'producto'}`}
            className="min-h-9.5 flex-1"
          >
            {({ pressed }) => (
              <View
                className={`min-h-9.5 w-full items-center justify-center rounded-xl border px-3.25 ${
                  pressed && !busy
                    ? 'border-[rgba(255,154,154,0.4)] bg-app-danger-bg'
                    : 'border-[rgba(255,154,154,0.22)] bg-[rgba(52,19,28,0.38)]'
                } ${busy ? 'opacity-[0.55]' : ''}`}
              >
                {busy ? (
                  <ActivityIndicator size="small" color="#FF9A9A" />
                ) : (
                  <Text className="text-[12px] font-extrabold tracking-[0.2px] text-app-danger">Eliminar</Text>
                )}
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </AnimatedView>
  );
}
