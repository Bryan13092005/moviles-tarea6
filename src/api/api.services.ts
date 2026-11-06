/**
 * CRUD de productos contra Supabase (tabla `public.productos`).
 *
 * Usa el cliente reutilizable de `src/db/supabase.ts`, que ya apunta a la
 * URL del proyecto (`EXPO_PUBLIC_SUPABASE_URL`) y viaja con la publishable key.
 *
 * Todas las funciones lanzan un `Error` con el mensaje de Postgres si la
 * operación falla, así puedes usarlas directamente con `try/catch`:
 *
 * ```ts
 * const productos = await getProductos();
 * const nuevo = await createProducto({ nombre: 'Café', precio: 3.5, stock: 10 });
 * ```
 */
import { supabase } from '@/db/supabase';
import type {
  Producto,
  ProductoInsert,
  ProductoUpdate,
} from '@/features/productos/productos.types';

const TABLA = 'productos';

type PostgrestErrorLike = {
  message: string;
  details?: string | null;
  hint?: string | null;
};

/** Convierte el error de PostgREST en un `Error` legible con contexto. */
function lanzarError(accion: string, error: PostgrestErrorLike): never {
  const detalle = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(' | ');

  throw new Error(`${accion}: ${detalle}`);
}

/** Lista todos los productos, del más reciente al más antiguo. */
export const getProductos = async (): Promise<Producto[]> => {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) lanzarError('No se pudieron obtener los productos', error);

  return data ?? [];
};

/** Obtiene un producto por su `id`. */
export const getProducto = async (id: number): Promise<Producto> => {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .eq('id', id)
    .single();

  if (error) lanzarError(`No se pudo obtener el producto ${id}`, error);

  return data;
};

/** Crea un producto y devuelve la fila insertada. */
export const createProducto = async (
  producto: ProductoInsert,
): Promise<Producto> => {
  const { data, error } = await supabase
    .from(TABLA)
    .insert(producto)
    .select('*')
    .single();

  if (error) lanzarError('No se pudo crear el producto', error);

  return data;
};

/** Actualiza un producto y devuelve la fila actualizada. */
export const updateProducto = async (
  id: number,
  cambios: ProductoUpdate,
): Promise<Producto> => {
  const { data, error } = await supabase
    .from(TABLA)
    .update(cambios)
    .eq('id', id)
    .select('*')
    .single();

  if (error) lanzarError(`No se pudo actualizar el producto ${id}`, error);

  return data;
};

/** Elimina un producto por su `id`. */
export const deleteProducto = async (id: number): Promise<void> => {
  const { error } = await supabase.from(TABLA).delete().eq('id', id);

  if (error) lanzarError(`No se pudo eliminar el producto ${id}`, error);
};
