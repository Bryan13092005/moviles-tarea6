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
import { useFormValidation } from "@/features/validation/useFormValidation";
import { validationRuleCombinations } from "@/features/validation/validationRules";

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
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageTouched, setImageTouched] = useState(false);
  const [focusedField, setFocusedField] = useState<keyof Values | null>(null);

  // Hook de validación en tiempo real para todos los campos de producto
  const validation = useFormValidation({
    nombre: validationRuleCombinations.productName,
    precio: validationRuleCombinations.productPrice,
    stock: validationRuleCombinations.productStock,
    descripcion: validationRuleCombinations.productDescription,
  });

  const previewUri = imagen?.uri ?? producto?.img ?? null;
  const hasImage = Boolean(imagen || producto?.img);
  const imageError =
    imageTouched && !hasImage
      ? editing
        ? "La imagen del producto es obligatoria."
        : "Debes seleccionar una imagen para crear el producto."
      : null;

  // Actualizar valor y validar en tiempo real mientras se escribe
  const handleInputChange = (key: keyof Values) => (text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    validation.handleFieldChange(key, text);
  };

  const handleInputBlur = (key: keyof Values) => () => {
    setFocusedField(null);
    validation.handleFieldBlur(key, values[key]);
  };

  const handleInputFocus = (key: keyof Values) => () => {
    setFocusedField(key);
    validation.handleFieldFocus(key);
  };

  const pick = async (mode: "library" | "camera") => {
    if (busy) return;
    setServerError(null);
    setImageTouched(true);
    try {
      const asset =
        mode === "camera"
          ? await tomarFotoProducto()
          : await seleccionarImagenProducto();
      if (asset) {
        setImagen(asset);
      }
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "No se pudo seleccionar la imagen.",
      );
    }
  };

  const submit = async () => {
    if (busy) return;
    setServerError(null);
    setImageTouched(true);

    // Validar todos los campos del producto en tiempo real
    const fieldsValid = validation.validateAll(values);

    if (!hasImage) {
      return;
    }

    if (!fieldsValid) {
      return;
    }

    const nombre = values.nombre.trim();
    const normalizedPrice = values.precio.trim().replace(",", ".");
    const precioNum = Number(normalizedPrice);
    const stockNum = Number.parseInt(values.stock.trim(), 10);

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
      setServerError(
        e instanceof Error ? e.message : "No se pudo guardar el producto.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Helper para determinar clases de borde según validación
  const getFieldBorderClass = (key: keyof Values) => {
    const state = validation.getFieldState(key);
    const val = values[key];
    const isError = state.isTouched && Boolean(state.error);
    const isSuccess = state.isTouched && state.isValid && val.trim().length > 0;

    if (isError) return "border-app-danger";
    if (isSuccess) return "border-app-green";
    if (focusedField === key) return "border-app-green";
    return "border-app-navy-line";
  };

  const nombreState = validation.getFieldState("nombre");
  const precioState = validation.getFieldState("precio");
  const stockState = validation.getFieldState("stock");
  const descripcionState = validation.getFieldState("descripcion");

  return (
    <View className="gap-3.5">
      {/* Error de servidor si ocurre */}
      {serverError ? (
        <View
          className="rounded-xl border border-[rgba(255,154,154,0.32)] bg-app-danger-bg px-3 py-2.5"
          accessibilityLiveRegion="polite"
        >
          <Text className="text-[12px] leading-4.25 text-app-danger">
            {serverError}
          </Text>
        </View>
      ) : null}

      {/* Campo: IMAGEN */}
      <View className="gap-2">
        <Label>IMAGEN *</Label>
        <View className="flex-row items-center gap-3">
          <View
            className={`h-22 w-22 items-center justify-center overflow-hidden rounded-2xl border bg-app-bg ${
              imageError
                ? "border-app-danger"
                : hasImage
                  ? "border-app-green"
                  : "border-app-navy-line"
            }`}
          >
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
                  className={`min-h-10 items-center justify-center rounded-xl border border-app-navy-line bg-app-navy-soft px-3.5 ${
                    pressed && !busy ? "border-[rgba(47,214,139,0.4)]" : ""
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
              <Text className="text-[11px] text-app-green-light">
                ✓ Nueva imagen seleccionada
              </Text>
            ) : null}
          </View>
        </View>
        {/* Mensaje de validación de imagen debajo del campo */}
        {imageError ? (
          <Text
            className="mt-1 text-[12px] font-medium leading-4 text-app-danger"
            accessibilityRole="alert"
          >
            {imageError}
          </Text>
        ) : null}
      </View>

      {/* Campo: NOMBRE */}
      <View className="gap-1.5">
        <Label>NOMBRE *</Label>
        <View className="relative justify-center">
          <TextInput
            value={values.nombre}
            onChangeText={handleInputChange("nombre")}
            onFocus={handleInputFocus("nombre")}
            onBlur={handleInputBlur("nombre")}
            placeholder="Nombre del producto (mín. 3 caracteres)"
            placeholderTextColor="#5C7A90"
            className={`min-h-12.5 rounded-[14px] border bg-app-navy-soft px-3.5 py-3 pr-10 text-[14px] text-app-text ${getFieldBorderClass(
              "nombre",
            )}`}
            editable={!busy}
            selectionColor="#2FD68B"
            keyboardAppearance="dark"
          />
          {nombreState.isTouched && values.nombre.length > 0 && (
            <View
              pointerEvents="none"
              className="absolute right-3.5 top-0 bottom-0 justify-center"
            >
              <Text
                className={`text-[13px] font-extrabold ${
                  nombreState.error ? "text-app-danger" : "text-app-green"
                }`}
              >
                {nombreState.error ? "✕" : "✓"}
              </Text>
            </View>
          )}
        </View>
        {/* Mensaje de validación debajo del campo */}
        {nombreState.isTouched && nombreState.error ? (
          <Text
            className="mt-1 text-[12px] font-medium leading-4 text-app-danger"
            accessibilityRole="alert"
          >
            {nombreState.error}
          </Text>
        ) : nombreState.isTouched &&
          nombreState.isValid &&
          values.nombre.trim().length > 0 ? (
          <Text className="mt-1 text-[12px] font-medium leading-4 text-app-green">
            ✓ Nombre válido
          </Text>
        ) : null}
      </View>

      {/* Campos: PRECIO y STOCK en paralelo */}
      <View className="flex-row items-start gap-3">
        {/* Campo: PRECIO */}
        <View className="flex-1 gap-1.5">
          <Label>PRECIO *</Label>
          <View className="relative justify-center">
            <TextInput
              value={values.precio}
              onChangeText={handleInputChange("precio")}
              onFocus={handleInputFocus("precio")}
              onBlur={handleInputBlur("precio")}
              placeholder="0.00"
              placeholderTextColor="#5C7A90"
              className={`min-h-12.5 rounded-[14px] border bg-app-navy-soft px-3.5 py-3 pr-10 text-[14px] text-app-text ${getFieldBorderClass(
                "precio",
              )}`}
              editable={!busy}
              keyboardType="decimal-pad"
              selectionColor="#2FD68B"
              keyboardAppearance="dark"
            />
            {precioState.isTouched && values.precio.length > 0 && (
              <View
                pointerEvents="none"
                className="absolute right-3.5 top-0 bottom-0 justify-center"
              >
                <Text
                  className={`text-[13px] font-extrabold ${
                    precioState.error ? "text-app-danger" : "text-app-green"
                  }`}
                >
                  {precioState.error ? "✕" : "✓"}
                </Text>
              </View>
            )}
          </View>
          {/* Mensaje de validación debajo del campo */}
          {precioState.isTouched && precioState.error ? (
            <Text
              className="mt-1 text-[12px] font-medium leading-4 text-app-danger"
              accessibilityRole="alert"
            >
              {precioState.error}
            </Text>
          ) : precioState.isTouched &&
            precioState.isValid &&
            values.precio.trim().length > 0 ? (
            <Text className="mt-1 text-[12px] font-medium leading-4 text-app-green">
              ✓ Precio válido
            </Text>
          ) : null}
        </View>

        {/* Campo: STOCK */}
        <View className="flex-1 gap-1.5">
          <Label>STOCK *</Label>
          <View className="relative justify-center">
            <TextInput
              value={values.stock}
              onChangeText={handleInputChange("stock")}
              onFocus={handleInputFocus("stock")}
              onBlur={handleInputBlur("stock")}
              placeholder="0"
              placeholderTextColor="#5C7A90"
              className={`min-h-12.5 rounded-[14px] border bg-app-navy-soft px-3.5 py-3 pr-10 text-[14px] text-app-text ${getFieldBorderClass(
                "stock",
              )}`}
              editable={!busy}
              keyboardType="number-pad"
              selectionColor="#2FD68B"
              keyboardAppearance="dark"
            />
            {stockState.isTouched && values.stock.length > 0 && (
              <View
                pointerEvents="none"
                className="absolute right-3.5 top-0 bottom-0 justify-center"
              >
                <Text
                  className={`text-[13px] font-extrabold ${
                    stockState.error ? "text-app-danger" : "text-app-green"
                  }`}
                >
                  {stockState.error ? "✕" : "✓"}
                </Text>
              </View>
            )}
          </View>
          {/* Mensaje de validación debajo del campo */}
          {stockState.isTouched && stockState.error ? (
            <Text
              className="mt-1 text-[12px] font-medium leading-4 text-app-danger"
              accessibilityRole="alert"
            >
              {stockState.error}
            </Text>
          ) : stockState.isTouched &&
            stockState.isValid &&
            values.stock.trim().length > 0 ? (
            <Text className="mt-1 text-[12px] font-medium leading-4 text-app-green">
              ✓ Stock válido
            </Text>
          ) : null}
        </View>
      </View>

      {/* Campo: DESCRIPCIÓN */}
      <View className="gap-1.5">
        <Label>DESCRIPCIÓN</Label>
        <TextInput
          value={values.descripcion}
          onChangeText={handleInputChange("descripcion")}
          onFocus={handleInputFocus("descripcion")}
          onBlur={handleInputBlur("descripcion")}
          placeholder="Descripción breve del producto (opcional)"
          placeholderTextColor="#5C7A90"
          className={`min-h-22.5 rounded-[14px] border bg-app-navy-soft px-3.5 py-3 text-[14px] text-app-text ${getFieldBorderClass(
            "descripcion",
          )}`}
          style={{ textAlignVertical: "top" }}
          editable={!busy}
          multiline
          selectionColor="#2FD68B"
          keyboardAppearance="dark"
        />
        {/* Mensaje de validación debajo del campo si aplica */}
        {descripcionState.isTouched && descripcionState.error ? (
          <Text
            className="mt-1 text-[12px] font-medium leading-4 text-app-danger"
            accessibilityRole="alert"
          >
            {descripcionState.error}
          </Text>
        ) : null}
      </View>

      {/* Botones de acción */}
      <View className="mt-2 flex-row gap-2.5">
        <Pressable
          onPress={onCancel}
          disabled={busy}
          accessibilityRole="button"
          className="min-h-12.5"
        >
          {({ pressed }) => (
            <View
              className={`min-h-12.5 items-center justify-center rounded-[15px] border border-app-navy-line px-4 ${
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
