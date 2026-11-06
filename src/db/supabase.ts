import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, type AppStateStatus } from 'react-native';

import type { Database } from '@/features/productos/productos.types';

/**
 * Cliente de Supabase para la app (Expo / React Native).
 *
 * Variables de entorno requeridas en `.env`:
 *
 *   EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
 *   EXPO_PUBLIC_SUPABASE_KEY=<publishable o anon key>
 *
 * Se pueden exponer sin problema: el acceso real a los datos lo controla
 * Row Level Security (RLS) en la base de datos.
 */
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_KEY en el archivo .env',
  );
}

/** Cliente único y reutilizable en toda la app. */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Esencial para React Native
    flowType: 'implicit',      // <-- AQUÍ ES DONDE SE DEFINE PARA SUPABASE
  },
});

/** Atajo para las operaciones de autenticación: `auth.getUser()`, `auth.signOut()`, etc. */
export const auth = supabase.auth;

export const supabaseAdmin =
  supabaseUrl && process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

/**
 * Activa la renovación automática del token solo mientras la app está en
 * primer plano (patrón recomendado por Supabase para React Native).
 *
 * Devuelve una función para desuscribirse; úsalo dentro de un `useEffect`:
 *
 * ```tsx
 * useEffect(() => registerAuthAutoRefresh(), []);
 * ```
 */
export function registerAuthAutoRefresh(): () => void {
  const handleAppStateChange = (state: AppStateStatus) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  };

  const subscription = AppState.addEventListener('change', handleAppStateChange);

  return () => subscription.remove();
}
