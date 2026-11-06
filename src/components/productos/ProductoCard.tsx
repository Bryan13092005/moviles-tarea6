import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { palette } from '@/constants/theme';
import type { Producto } from '@/features/productos/productos.types';

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

export function ProductoCard({ producto, onEdit, onDelete, busy, index = 0 }: Props) {
  const lowStock = producto.stock != null && producto.stock <= 5;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 70)
        .duration(420)
        .springify()
        .damping(18)}
      style={styles.card}
    >
      <View style={styles.cardGlow} pointerEvents="none" />
      <View style={styles.cardAccent} pointerEvents="none" />

      <View style={styles.imageWrap}>
        <View style={styles.imageRing}>
          <View style={styles.imageBox}>
            {producto.img ? (
              <Image source={{ uri: producto.img }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imageFallback}>
                <View style={styles.imageFallbackIcon}>
                  <Text style={styles.imageFallbackText}>IMG</Text>
                </View>
              </View>
            )}
          </View>
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.pricePillText}>{formatPrice(producto.precio)}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {producto.nombre?.trim() || 'Sin nombre'}
        </Text>

        <View style={styles.metaRow}>
          {producto.stock != null ? (
            <View style={[styles.stockBadge, lowStock && styles.stockBadgeLow]}>
              <View style={[styles.stockDot, lowStock && styles.stockDotLow]} />
              <Text style={[styles.stockText, lowStock && styles.stockTextLow]}>
                {producto.stock} en stock
              </Text>
            </View>
          ) : (
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>Stock —</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => onEdit(producto)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Actualizar ${producto.nombre ?? 'producto'}`}
            style={({ pressed }) => [
              styles.btn,
              styles.editBtn,
              pressed && !busy && styles.editPressed,
              busy && styles.muted,
            ]}
          >
            <Text style={styles.editText}>Actualizar</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(producto)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${producto.nombre ?? 'producto'}`}
            style={({ pressed }) => [
              styles.btn,
              styles.deleteBtn,
              pressed && !busy && styles.deletePressed,
              busy && styles.muted,
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={palette.danger} />
            ) : (
              <Text style={styles.deleteText}>Eliminar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 139, 0.18)',
    backgroundColor: 'rgba(8, 26, 43, 0.97)',
    overflow: 'hidden',
    shadowColor: palette.blueGlow,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardGlow: {
    position: 'absolute',
    right: -30,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 104, 168, 0.16)',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 18,
    bottom: 18,
    width: 3,
    borderRadius: 999,
    backgroundColor: palette.green,
    opacity: 0.85,
  },
  imageWrap: {
    alignItems: 'center',
    gap: 8,
  },
  imageRing: {
    padding: 2,
    borderRadius: 18,
    backgroundColor: 'rgba(47, 214, 139, 0.22)',
  },
  imageBox: {
    width: 94,
    height: 94,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(168, 242, 201, 0.18)',
    backgroundColor: palette.navySoft,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.navy,
  },
  imageFallbackIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.navyLine,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 34, 54, 0.9)',
  },
  imageFallbackText: { color: palette.textDim, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  pricePill: {
    maxWidth: 98,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168, 242, 201, 0.28)',
    backgroundColor: 'rgba(12, 59, 42, 0.72)',
  },
  pricePillText: {
    color: palette.greenLight,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  body: { flex: 1, minWidth: 0, paddingTop: 2 },
  name: { color: palette.text, fontSize: 16, fontWeight: '800', lineHeight: 21, letterSpacing: -0.2 },
  metaRow: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(143, 168, 186, 0.18)',
    backgroundColor: 'rgba(12, 34, 54, 0.7)',
  },
  stockBadgeLow: {
    borderColor: 'rgba(255, 154, 154, 0.22)',
    backgroundColor: 'rgba(52, 19, 28, 0.35)',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.green,
  },
  stockDotLow: { backgroundColor: palette.danger },
  stockText: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  stockTextLow: { color: palette.danger },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: {
    flex: 1,
    borderColor: 'rgba(168, 242, 201, 0.22)',
    backgroundColor: 'rgba(12, 34, 54, 0.95)',
  },
  editPressed: {
    borderColor: 'rgba(47, 214, 139, 0.55)',
    backgroundColor: 'rgba(12, 59, 42, 0.45)',
  },
  editText: { color: palette.greenLight, fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  deleteBtn: {
    flex: 1,
    borderColor: 'rgba(255, 154, 154, 0.22)',
    backgroundColor: 'rgba(52, 19, 28, 0.38)',
  },
  deletePressed: { backgroundColor: palette.dangerBg, borderColor: 'rgba(255, 154, 154, 0.4)' },
  deleteText: { color: palette.danger, fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },
  muted: { opacity: 0.55 },
});
