/**
 * Subida y borrado de imágenes de productos en Supabase Storage.
 *
 * Bucket: `productosIMG`.
 *
 * Requisitos en el panel de Supabase:
 *  - Crear el bucket `productosIMG` y marcarlo como **público** (las URLs que
 *    devuelve `getPublicUrl` solo son accesibles si el bucket es público o si
 *    tienes una política de lectura para el rol `anon`/`authenticated`).
 *  - Añadir políticas RLS de `insert`/`delete` sobre `storage.objects` para el
 *    rol que sube las fotos (normalmente `authenticated`).
 *
 * Las imágenes se guardan en una carpeta con el id del usuario autenticado
 * (o en `productos` si no hay sesión), lo que encaja con la política habitual:
 *
 * ```sql
 * (storage.foldername(name))[1] = auth.uid()::text
 * ```
 */
import type { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from '@/db/supabase';

/** Nombre del bucket de Supabase Storage donde viven las imágenes. */
export const BUCKET_PRODUCTOS = 'productosIMG';

/** Resultado de subir una imagen. */
export type ImagenSubida = {
  /** Ruta dentro del bucket (sirve para borrarla después). */
  path: string;
  /** URL pública que se guarda en `productos.img`. */
  url: string;
};

/** Opciones de `subirImagenProducto`. */
export type OpcionesSubida = {
  /** Carpeta dentro del bucket. Por defecto, el id del usuario autenticado. */
  carpeta?: string;
  /** Nombre del archivo (sin carpeta). Por defecto se genera uno único. */
  nombreArchivo?: string;
};

const MIME_POR_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
  avif: 'image/avif',
};

/** Devuelve la extensión (sin punto) de un nombre o URI, o `null`. */
function extensionDesdeNombre(nombre: string): string | null {
  const sinParametros = nombre.split('?')[0];
  const coincidencia = /\.([a-zA-Z0-9]+)$/.exec(sinParametros);
  return coincidencia?.[1]?.toLowerCase() ?? null;
}

/** Extensión con la que se guardará el archivo en el bucket. */
function obtenerExtension(asset: ImagePickerAsset): string {
  const nombre = asset.fileName ?? asset.uri;
  const extension = extensionDesdeNombre(nombre);

  if (extension) return extension === 'jpeg' ? 'jpg' : extension;

  switch (asset.mimeType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return 'jpg';
  }
}

/** `Content-Type` que se envía a Storage. */
function obtenerContentType(asset: ImagePickerAsset, extension: string): string {
  return asset.mimeType ?? MIME_POR_EXTENSION[extension] ?? 'image/jpeg';
}

/** Lee los bytes de la imagen elegida en cualquier plataforma. */
async function leerBytes(asset: ImagePickerAsset): Promise<ArrayBuffer> {
  // En web el picker entrega un `File` real.
  if (Platform.OS === 'web') {
    if (asset.file) return asset.file.arrayBuffer();

    const respuesta = await fetch(asset.uri);
    return respuesta.arrayBuffer();
  }

  // En iOS/Android el URI es local (`file://...`) y `fetch` no lo lee de
  // forma fiable, así que usamos `expo-file-system` (solo existe en nativo).
  const { File } = await import('expo-file-system');
  return new File(asset.uri).arrayBuffer();
}

/** Carpeta por defecto: el id del usuario autenticado o `productos`. */
async function carpetaPorDefecto(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? 'productos';
}

/** Quita barras sobrantes para que la ruta sea válida en Storage. */
function normalizarCarpeta(carpeta: string): string {
  const limpia = carpeta.trim().replace(/^\/+|\/+$/g, '');
  return limpia.length > 0 ? limpia : 'productos';
}

/**
 * Sube una imagen elegida con `expo-image-picker` al bucket `productosIMG`.
 *
 * Devuelve la ruta interna y la URL pública; guarda la URL en `productos.img`.
 *
 * ```ts
 * const { url } = await subirImagenProducto(asset);
 * ```
 */
export async function subirImagenProducto(
  asset: ImagePickerAsset,
  opciones: OpcionesSubida = {},
): Promise<ImagenSubida> {
  const extension = obtenerExtension(asset);
  const contentType = obtenerContentType(asset, extension);
  const carpeta = normalizarCarpeta(
    opciones.carpeta ?? (await carpetaPorDefecto()),
  );
  const nombreArchivo =
    opciones.nombreArchivo ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
  const path = `${carpeta}/${nombreArchivo}`;

  const bytes = await leerBytes(asset);

  // 1. Obtener la sesión activa
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  console.error('No hay usuario autenticado activo en el cliente de Supabase.');
  throw new Error('Debes iniciar sesión para subir imágenes.');
}

console.log('Usuario autenticado enviando la petición:', session.user.id);

// 2. Proceder con la subida normalmente
const { error } = await supabase.storage
  .from(BUCKET_PRODUCTOS)
  .upload(path, bytes, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    throw new Error(`No se pudo subir la imagen del producto: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET_PRODUCTOS)
    .getPublicUrl(path);

  return { path, url: data.publicUrl };
}

/**
 * Convierte una URL pública (o una ruta interna) en la ruta del bucket.
 *
 * Devuelve `null` si la URL pertenece a otro bucket o tiene un formato
 * desconocido.
 */
export function rutaImagenDesdeUrl(urlORuta: string): string | null {
  if (!urlORuta.startsWith('http')) {
    return urlORuta.replace(/^\/+/, '') || null;
  }

  const prefijos = [
    `/storage/v1/object/public/${BUCKET_PRODUCTOS}/`,
    `/storage/v1/object/sign/${BUCKET_PRODUCTOS}/`,
    `/storage/v1/object/authenticated/${BUCKET_PRODUCTOS}/`,
  ];

  for (const prefijo of prefijos) {
    const indice = urlORuta.indexOf(prefijo);
    if (indice !== -1) {
      return decodeURIComponent(
        urlORuta.slice(indice + prefijo.length).split('?')[0],
      );
    }
  }

  return null;
}

/**
 * Borra una imagen del bucket. Acepta la URL pública guardada en la tabla o
 * la ruta interna devuelta por `subirImagenProducto`.
 */
export async function eliminarImagenProducto(
  urlORuta: string,
): Promise<void> {
  const path = rutaImagenDesdeUrl(urlORuta);
  if (!path) return;

  const { error } = await supabase.storage
    .from(BUCKET_PRODUCTOS)
    .remove([path]);

  if (error) {
    throw new Error(`No se pudo eliminar la imagen del producto: ${error.message}`);
  }
}
