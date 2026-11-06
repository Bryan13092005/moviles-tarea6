/**
 * Tipos de la tabla `public.productos` de Supabase.
 *
 * | Columna       | Tipo Postgres | Nulo |
 * | ------------- | ------------- | ---- |
 * | id            | int8 (identity) | no |
 * | created_at    | timestamptz   | no   |
 * | nombre        | varchar       | sí   |
 * | precio        | float4        | sí   |
 * | stock         | int4          | sí   |
 * | descripcion   | varchar       | sí   |
 * | img           | text          | sí   |
 */

/** Fila tal como la devuelve Supabase. */
export type Producto = {
  /** `int8` identity. */
  id: number;
  /** `timestamptz`, se genera en la base de datos. */
  created_at: string;
  nombre: string | null;
  precio: number | null;
  stock: number | null;
  descripcion: string | null;
  /** URL o ruta de la imagen. */
  img: string | null;
};

/** Columnas que puede escribir el cliente (`id` y `created_at` los pone la BD). */
export type ProductoCampos = Omit<Producto, 'id' | 'created_at'>;

/**
 * Payload para crear un producto. Todas las columnas son opcionales
 * porque en la tabla aceptan `NULL`.
 */
export type ProductoInsert = Partial<ProductoCampos>;

/** Payload para actualizar (parcial: solo los campos que cambian). */
export type ProductoUpdate = Partial<ProductoCampos>;

/**
 * Esquema mínimo de la base de datos para tipar el cliente de Supabase
 * (`createClient<Database>` en `src/db/supabase.ts`).
 */
export type Database = {
  public: {
    Tables: {
      productos: {
        Row: Producto;
        Insert: ProductoInsert;
        Update: ProductoUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
