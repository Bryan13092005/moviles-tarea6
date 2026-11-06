/**
 * Flujo completo de la foto de un producto:
 *
 *  1. El usuario elige una imagen de la galería o hace una foto con
 *     `expo-image-picker`.
 *  2. La imagen se sube al bucket `productosIMG` de Supabase Storage.
 *  3. La URL pública se guarda en la columna `img` de la tabla `productos`.
 *
 * Ejemplo en una pantalla:
 *
 * ```tsx
 * const [imagen, setImagen] = useState<ImagePicker.ImagePickerAsset | null>(null);
 *
 * const elegirFoto = async () => {
 *   const asset = await seleccionarImagenProducto();
 *   if (asset) setImagen(asset);
 * };
 *
 * const guardar = async () => {
 *   if (!imagen) return;
 *   await crearProductoConImagen(
 *     { nombre: 'Café', precio: 3.5, stock: 10 },
 *     imagen,
 *   );
 * };
 * ```
 *
 * Si la app ya tiene un producto creado y solo quieres cambiar su foto:
 *
 * ```ts
 * const asset = await tomarFotoProducto();
 * if (asset) await actualizarImagenProducto(producto.id, asset);
 * ```
 */
import type { ImagePickerAsset, ImagePickerOptions } from 'expo-image-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  createProducto,
  getProducto,
  updateProducto,
} from '@/api/api.services';
import {
  eliminarImagenProducto,
  subirImagenProducto,
} from '@/api/storage.services';
import type {
  Producto,
  ProductoInsert,
} from '@/features/productos/productos.types';

/** Opciones comunes a la galería y a la cámara. */
const OPCIONES_POR_DEFECTO: ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
  exif: false,
};

/**
 * Abre la galería del dispositivo y devuelve la imagen elegida.
 *
 * Devuelve `null` si el usuario cancela. Lanza un `Error` si no concede el
 * permiso de acceso a las fotos.
 */
export async function seleccionarImagenProducto(
  opciones: ImagePickerOptions = {},
): Promise<ImagePickerAsset | null> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permiso.granted) {
    throw new Error(
      'Necesitamos permiso para acceder a tus fotos y poder subir la imagen del producto.',
    );
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    ...OPCIONES_POR_DEFECTO,
    ...opciones,
  });

  if (resultado.canceled) return null;

  return resultado.assets[0] ?? null;
}

/**
 * Abre la cámara y devuelve la foto tomada.
 *
 * Devuelve `null` si el usuario cancela. Lanza un `Error` si no concede el
 * permiso de cámara.
 */
export async function tomarFotoProducto(
  opciones: ImagePickerOptions = {},
): Promise<ImagePickerAsset | null> {
  const permiso = await ImagePicker.requestCameraPermissionsAsync();

  if (!permiso.granted) {
    throw new Error(
      'Necesitamos permiso para usar la cámara y poder tomar la foto del producto.',
    );
  }

  const resultado = await ImagePicker.launchCameraAsync({
    ...OPCIONES_POR_DEFECTO,
    ...opciones,
  });

  if (resultado.canceled) return null;

  return resultado.assets[0] ?? null;
}

/**
 * Crea un producto subiendo primero su imagen.
 *
 * Si el `insert` falla, borra la imagen recién subida para no dejar archivos
 * huérfanos en el bucket.
 */
export async function crearProductoConImagen(
  datos: ProductoInsert,
  imagen: ImagePickerAsset,
): Promise<Producto> {
  const subida = await subirImagenProducto(imagen);

  try {
    return await createProducto({ ...datos, img: subida.url });
  } catch (error) {
    await eliminarImagenProducto(subida.path).catch(() => undefined);
    throw error;
  }
}

/**
 * Reemplaza la foto de un producto existente y actualiza `productos.img`.
 *
 * La imagen anterior se elimina del bucket solo si la actualización se guardó
 * correctamente.
 */
export async function actualizarImagenProducto(
  id: number,
  imagen: ImagePickerAsset,
): Promise<Producto> {
  const producto = await getProducto(id);
  const subida = await subirImagenProducto(imagen);

  try {
    const actualizado = await updateProducto(id, { img: subida.url });

    if (producto.img) {
      await eliminarImagenProducto(producto.img).catch(() => undefined);
    }

    return actualizado;
  } catch (error) {
    await eliminarImagenProducto(subida.path).catch(() => undefined);
    throw error;
  }
}

/** Quita la foto de un producto (deja `img` en `null`) y borra el archivo. */
export async function quitarImagenProducto(id: number): Promise<Producto> {
  const producto = await getProducto(id);
  const actualizado = await updateProducto(id, { img: null });

  if (producto.img) {
    await eliminarImagenProducto(producto.img).catch(() => undefined);
  }

  return actualizado;
}
