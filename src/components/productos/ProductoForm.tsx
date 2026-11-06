import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ImagePickerAsset } from 'expo-image-picker';

import { createProducto, updateProducto } from '@/api/api.services';
import {
  seleccionarImagenProducto,
  tomarFotoProducto,
} from '@/api/productos.imagen.services';
import { eliminarImagenProducto, subirImagenProducto } from '@/api/storage.services';
import { palette } from '@/constants/theme';
import type { Producto } from '@/features/productos/productos.types';

type Values = {
  nombre: string;
  precio: string;
  stock: string;
  descripcion: string;
};

type Props = {
  producto?: Producto | null;
  onSaved: (producto: Producto) => void;
  onCancel: () => void;
};

function toValues(producto?: Producto | null): Values {
  return {
    nombre: producto?.nombre ?? '',
    precio: producto?.precio != null ? String(producto.precio) : '',
    stock: producto?.stock != null ? String(producto.stock) : '',
    descripcion: producto?.descripcion ?? '',
  };
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function ProductoForm({ producto, onSaved, onCancel }: Props) {
  const editing = Boolean(producto?.id);
  const [values, setValues] = useState<Values>(() => toValues(producto));
  const [imagen, setImagen] = useState<ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewUri = imagen?.uri ?? producto?.img ?? null;

  const set = (key: keyof Values) => (text: string) =>
    setValues((v) => ({ ...v, [key]: text }));

  const pick = async (mode: 'library' | 'camera') => {
    if (busy) return;
    setError(null);
    try {
      const asset =
        mode === 'camera' ? await tomarFotoProducto() : await seleccionarImagenProducto();
      if (asset) setImagen(asset);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo seleccionar la imagen.');
    }
  };

  const submit = async () => {
    if (busy) return;
    setError(null);

    const nombre = values.nombre.trim();
    const precioNum = values.precio.trim() ? Number(values.precio) : null;
    const stockNum = values.stock.trim() ? Number.parseInt(values.stock, 10) : null;

    if (!nombre) return setError('El nombre es obligatorio.');
    if (precioNum == null || Number.isNaN(precioNum) || precioNum < 0)
      return setError('Ingresa un precio válido.');
    if (stockNum == null || Number.isNaN(stockNum) || stockNum < 0)
      return setError('Ingresa un stock válido.');
    if (!editing && !imagen)
      return setError('La imagen es obligatoria para crear un producto.');
    if (editing && !imagen && !producto?.img)
      return setError('La imagen es obligatoria.');

    setBusy(true);
    try {
      const datos = {
        nombre,
        precio: precioNum,
        stock: stockNum,
        descripcion: values.descripcion.trim() || null,
      };

      let saved: Producto;
      if (!editing) {
        const subida = await subirImagenProducto(imagen!);
        try {
          saved = await createProducto({ ...datos, img: subida.url });
        } catch (err) {
          await eliminarImagenProducto(subida.path).catch(() => undefined);
          throw err;
        }
      } else if (imagen) {
        const subida = await subirImagenProducto(imagen);
        try {
          saved = await updateProducto(producto!.id, { ...datos, img: subida.url });
          if (producto?.img) {
            await eliminarImagenProducto(producto.img).catch(() => undefined);
          }
        } catch (err) {
          await eliminarImagenProducto(subida.path).catch(() => undefined);
          throw err;
        }
      } else {
        saved = await updateProducto(producto!.id, datos);
      }

      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el producto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      {error ? (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Label>IMAGEN *</Label>
        <View style={styles.imageRow}>
          <View style={styles.previewBox}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <Text style={styles.previewHint}>Sin imagen</Text>
            )}
          </View>
          <View style={styles.imageActions}>
            <Pressable
              onPress={() => pick('library')}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryBtn, pressed && !busy && styles.secondaryPressed, busy && styles.muted]}
            >
              <Text style={styles.secondaryBtnText}>Galería</Text>
            </Pressable>
            <Pressable
              onPress={() => pick('camera')}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.secondaryBtn, pressed && !busy && styles.secondaryPressed, busy && styles.muted]}
            >
              <Text style={styles.secondaryBtnText}>Cámara</Text>
            </Pressable>
            {imagen ? <Text style={styles.imageNote}>Nueva imagen seleccionada</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.field}>
        <Label>NOMBRE *</Label>
        <TextInput
          value={values.nombre}
          onChangeText={set('nombre')}
          placeholder="Nombre del producto"
          placeholderTextColor={palette.textDim}
          style={styles.input}
          editable={!busy}
          selectionColor={palette.green}
          keyboardAppearance="dark"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, styles.flex1]}>
          <Label>PRECIO *</Label>
          <TextInput
            value={values.precio}
            onChangeText={set('precio')}
            placeholder="0.00"
            placeholderTextColor={palette.textDim}
            style={styles.input}
            editable={!busy}
            keyboardType="decimal-pad"
            selectionColor={palette.green}
            keyboardAppearance="dark"
          />
        </View>
        <View style={[styles.field, styles.flex1]}>
          <Label>STOCK *</Label>
          <TextInput
            value={values.stock}
            onChangeText={set('stock')}
            placeholder="0"
            placeholderTextColor={palette.textDim}
            style={styles.input}
            editable={!busy}
            keyboardType="number-pad"
            selectionColor={palette.green}
            keyboardAppearance="dark"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Label>DESCRIPCIÓN</Label>
        <TextInput
          value={values.descripcion}
          onChangeText={set('descripcion')}
          placeholder="Descripción breve"
          placeholderTextColor={palette.textDim}
          style={[styles.input, styles.textarea]}
          editable={!busy}
          multiline
          selectionColor={palette.green}
          keyboardAppearance="dark"
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.ghostBtn, pressed && !busy && styles.secondaryPressed, busy && styles.muted]}
        >
          <Text style={styles.ghostBtnText}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryBtn, pressed && !busy && styles.primaryPressed, busy && styles.muted]}
        >
          {busy ? <ActivityIndicator color={palette.greenDeep} /> : <Text style={styles.primaryBtnText}>{editing ? 'Guardar cambios' : 'Crear producto'}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  field: { gap: 8 },
  label: { color: palette.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.6 },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.navyLine,
    backgroundColor: palette.navySoft,
    color: palette.text,
    fontSize: 14,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  imageRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  previewBox: {
    width: 88,
    height: 88,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.navyLine,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  preview: { width: '100%', height: '100%' },
  previewHint: { color: palette.textDim, fontSize: 11 },
  imageActions: { flex: 1, gap: 8 },
  imageNote: { color: palette.greenLight, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryBtn: {
    flex: 1,
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: palette.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryPressed: { backgroundColor: palette.green },
  primaryBtnText: { color: palette.greenDeep, fontSize: 14, fontWeight: '800' },
  secondaryBtn: {
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.navyLine,
    backgroundColor: palette.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryPressed: { borderColor: 'rgba(47, 214, 139, 0.4)' },
  secondaryBtnText: { color: palette.text, fontSize: 13, fontWeight: '600' },
  ghostBtn: {
    minHeight: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.navyLine,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  ghostBtnText: { color: palette.textMuted, fontSize: 14, fontWeight: '600' },
  muted: { opacity: 0.55 },
  banner: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 154, 0.32)',
    backgroundColor: palette.dangerBg,
  },
  bannerText: { color: palette.danger, fontSize: 12, lineHeight: 17 },
});
