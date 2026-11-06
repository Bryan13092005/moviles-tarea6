import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/theme';
import type { Producto } from '@/features/productos/productos.types';

type Props = {
  producto: Producto;
  onEdit: (producto: Producto) => void;
  onDelete: (producto: Producto) => void;
  busy?: boolean;
};

function formatPrice(value: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${value.toFixed(2)}`;
}

export function ProductoCard({ producto, onEdit, onDelete, busy }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageBox}>
        {producto.img ? (
          <Image source={{ uri: producto.img }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>IMG</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {producto.nombre?.trim() || 'Sin nombre'}
        </Text>
        <Text style={styles.price}>{formatPrice(producto.precio)}</Text>
        {producto.stock != null ? (
          <Text style={styles.meta}>Stock: {producto.stock}</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => onEdit(producto)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Actualizar ${producto.nombre ?? 'producto'}`}
            style={({ pressed }) => [styles.btn, styles.editBtn, pressed && !busy && styles.editPressed, busy && styles.muted]}
          >
            <Text style={styles.editText}>Actualizar</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(producto)}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${producto.nombre ?? 'producto'}`}
            style={({ pressed }) => [styles.btn, styles.deleteBtn, pressed && !busy && styles.deletePressed, busy && styles.muted]}
          >
            {busy ? <ActivityIndicator size="small" color={palette.danger} /> : <Text style={styles.deleteText}>Eliminar</Text>}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(24, 56, 80, 0.9)',
    backgroundColor: 'rgba(9, 27, 43, 0.94)',
  },
  imageBox: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.navyLine,
    backgroundColor: palette.navySoft,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageFallbackText: { color: palette.textDim, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  body: { flex: 1, minWidth: 0 },
  name: { color: palette.text, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  price: { marginTop: 4, color: palette.greenLight, fontSize: 16, fontWeight: '800' },
  meta: { marginTop: 2, color: palette.textDim, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBtn: { borderColor: palette.navyLine, backgroundColor: palette.navySoft },
  editPressed: { borderColor: 'rgba(47, 214, 139, 0.4)' },
  editText: { color: palette.text, fontSize: 12, fontWeight: '700' },
  deleteBtn: { borderColor: 'rgba(255, 154, 154, 0.28)', backgroundColor: 'rgba(52, 19, 28, 0.45)' },
  deletePressed: { backgroundColor: palette.dangerBg },
  deleteText: { color: palette.danger, fontSize: 12, fontWeight: '700' },
  muted: { opacity: 0.55 },
});
