import type { ImagePickerAsset } from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { createProducto, updateProducto } from "@/api/api.services";
import {
  seleccionarImagenProducto,
  tomarFotoProducto,
} from "@/api/productos.imagen.services";
import {
  eliminarImagenProducto,
  subirImagenProducto,
} from "@/api/storage.services";
import type { Producto } from "@/features/productos/productos.types";

type Values = {
  nombre: string;
  precio: string;
  stock: string;
  descripcion: string;
};

type Props = {
  producto?: Producto | null;
  onSaved: (producto: Producto, isNew?: boolean) => void;
  onCancel: () => void;
};

function toValues(producto?: Producto | null): Values {
  return {
    nombre: producto?.nombre ?? "",
    precio: producto?.precio != null ? String(producto.precio) : "",
    stock: producto?.stock != null ? String(producto.stock) : "",
    descripcion: producto?.descripcion ?? "",
  };
}

function Label({ children }: { children: string }) {
  return (
    <Text className="text-[9px] font-bold tracking-[1.6px] text-app-text-muted">
      {children}
    </Text>
  );
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

  const pick = async (mode: "library" | "camera") => {
    if (busy) return;
    setError(null);
    try {
      const asset =
        mode === "camera"
          ? await tomarFotoProducto()
          : await seleccionarImagenProducto();
      if (asset) setImagen(asset);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo seleccionar la imagen.",
      );
    }
  };

  const submit = async () => {
    if (busy) return;
    setError(null);

    const nombre = values.nombre.trim();
    const precioNum = values.precio.trim() ? Number(values.precio) : null;
    const stockNum = values.stock.trim()
      ? Number.parseInt(values.stock, 10)
      : null;

    if (!nombre) return setError("El nombre es obligatorio.");
    if (precioNum == null || Number.isNaN(precioNum) || precioNum < 0)
      return setError("Ingresa un precio válido.");
    if (stockNum == null || Number.isNaN(stockNum) || stockNum < 0)
      return setError("Ingresa un stock válido.");
    if (!editing && !imagen)
      return setError("La imagen es obligatoria para crear un producto.");
    if (editing && !imagen && !producto?.img)
      return setError("La imagen es obligatoria.");

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
          saved = await updateProducto(producto!.id, {
            ...datos,
            img: subida.url,
          });
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

      onSaved(saved, !editing);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar el producto.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-3.5">
      {error ? (
        <View
          className="rounded-xlder border-[rgba(255,154,154,0.32)] bg-app-danger-bg px-3 py-2.5"
          accessibilityLiveRegion="polite"
        >
          <Text className="text-[12px] leading-4.25 text-app-danger">
            {error}
          </Text>
        </View>
      ) : null}

      <View className="gap-2">
        <Label>IMAGEN *</Label>
        <View className="flex-row items-center gap-3">
          <View className="h-22 w-22 items-center justify-center overflow-hidden rounded-2xl border border-app-navy-line bg-app-bg">
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <Text className="text-[11px] text-app-text-dim">Sin imagen</Text>
            )}
          </View>
          <View className="flex-1 gap-2">
            <Pressable
              onPress={() => pick("library")}
              disabled={busy}
              accessibilityRole="button"
              className="min-h-10"
            >
              {({ pressed }) => (
                <View
                  className={`min-h-10 items-center justify-center rounded-xlder border-app-navy-line bg-app-navy-softsoft px-3.5
                    pressed && !busy ? 'border-[rgba(47,214,139,0.4)]' : ''
                  } ${busy ? "opacity-[0.55]" : ""}`}
                >
                  <Text className="text-[13px] font-semibold text-app-text">
                    Galería
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => pick("camera")}
              disabled={busy}
              accessibilityRole="button"
              className="min-h-10"
            >
              {({ pressed }) => (
                <View
                  className={`min-h-10 items-center justify-center rounded-xl border border-app-navy-line bg-app-navy-soft px-3.5 ${
                    pressed && !busy ? "border-[rgba(47,214,139,0.4)]" : ""
                  } ${busy ? "opacity-[0.55]" : ""}`}
                >
                  <Text className="text-[13px] font-semibold text-app-text">
                    Cámara
                  </Text>
                </View>
              )}
            </Pressable>
            {imagen ? (
              <Text className="text-[11px] text-app-green-light-light">
                Nueva imagen seleccionada
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Label>NOMBRE *</Label>
        <TextInput
          value={values.nombre}
          onChangeText={set("nombre")}
          placeholder="Nombre del producto"
          placeholderTextColor="#5C7A90"
          className="min-h-12.5ounded-[14px] border border-app-navy-line bg-app-navy-soft px-3.5 py-3 text-[14px] text-app-text"
          editable={!busy}
          selectionColor="#2FD68B"
          keyboardAppearance="dark"
        />
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1 gap-2">
          <Label>PRECIO *</Label>
          <TextInput
            value={values.precio}
            onChangeText={set("precio")}
            placeholder="0.00"
            placeholderTextColor="#5C7A90"
            className="min-h-12.5 rounded-[14px] border border-app-navy-line bg-app-navy-soft px-3.5 py-3 text-[14px] text-app-text"
            editable={!busy}
            keyboardType="decimal-pad"
            selectionColor="#2FD68B"
            keyboardAppearance="dark"
          />
        </View>
        <View className="flex-1 gap-2">
          <Label>STOCK *</Label>
          <TextInput
            value={values.stock}
            onChangeText={set("stock")}
            placeholder="0"
            placeholderTextColor="#5C7A90"
            className="min-h-12.5 rounded-[14px] border border-app-navy-lineline bg-app-navy-soft px-3.5 py-3 text-[14px] text-app-text"
            editable={!busy}
            keyboardType="number-pad"
            selectionColor="#2FD68B"
            keyboardAppearance="dark"
          />
        </View>
      </View>

      <View className="gap-2">
        <Label>DESCRIPCIÓN</Label>
        <TextInput
          value={values.descripcion}
          onChangeText={set("descripcion")}
          placeholder="Descripción breve"
          placeholderTextColor="#5C7A90"
          className="min-h-22.5 rounded-[14px] border border-app-navy-line bg-app-navy-soft px-3.5 py-3 text-[14px] text-app-text"
          style={{ textAlignVertical: "top" }}
          editable={!busy}
          multiline
          selectionColor="#2FD68B"
          keyboardAppearance="dark"
        />
      </View>

      <View className="mt-1 flex-row gap-2.5">
        <Pressable
          onPress={onCancel}
          disabled={busy}
          accessibilityRole="button"
          className="min-h-12.5"
        >
          {({ pressed }) => (
            <View
              className={`min-h-12.5 items-center justify-center rounded-[15px] border border-app-navy-line px-3.5 ${
                pressed && !busy ? "border-[rgba(47,214,139,0.4)]" : ""
              } ${busy ? "opacity-[0.55]" : ""}`}
            >
              <Text className="text-[14px] font-semibold text-app-text-muted">
                Cancelar
              </Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={submit}
          disabled={busy}
          accessibilityRole="button"
          className="min-h-12.5 flex-1"
        >
          {({ pressed }) => (
            <View
              className={`min-h-12.5 flex-1 items-center justify-center rounded-[15px] px-3.5 ${
                pressed && !busy ? "bg-app-green" : "bg-app-green-light"
              } ${busy ? "opacity-[0.55]" : ""}`}
            >
              {busy ? (
                <ActivityIndicator color="#072A1E" />
              ) : (
                <Text className="text-[14px] font-extrabold text-app-green-deep">
                  {editing ? "Guardar cambios" : "Crear producto"}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
