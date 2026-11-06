/**
 * Autenticación con Supabase usando la misma API que Firebase Auth.
 *
 * Este módulo adapta los métodos de `supabase.auth` a los nombres y firmas
 * que ya conoces de Firebase (`EmailAuthProvider`, `createUserWithEmailAndPassword`,
 * `onAuthStateChanged`, etc.), para que las pantallas no tengan que cambiar:
 *
 * | Firebase                             | Supabase                                  |
 * | ------------------------------------ | ----------------------------------------- |
 * | `EmailAuthProvider.credential`       | `{ email, password }`                     |
 * | `createUserWithEmailAndPassword`     | `auth.signUp`                             |
 * | `signInWithEmailAndPassword`         | `auth.signInWithPassword`                 |
 * | `reauthenticateWithCredential`       | `auth.signInWithPassword` (verifica clave)|
 * | `sendPasswordResetEmail`             | `auth.resetPasswordForEmail`              |
 * | `onAuthStateChanged`                 | `auth.onAuthStateChange`                  |
 * | `signOut`                            | `auth.signOut`                            |
 * | `updatePassword`                     | `auth.updateUser({ password })`           |
 *
 * Todas las funciones reciben el cliente de autenticación como primer
 * argumento (igual que Firebase) y **lanzan un `Error`** con un mensaje en
 * español si Supabase devuelve un error, así puedes usar `try/catch`:
 *
 * ```ts
 * import {
 *   auth,
 *   signInWithEmailAndPassword,
 * } from '@/features/auth/supabaseAuth';
 *
 * try {
 *   const { user, session } = await signInWithEmailAndPassword(
 *     auth,
 *     'ana@correo.com',
 *     'mi-clave',
 *   );
 *   console.log('Sesión iniciada', user.id, session?.access_token);
 * } catch (error) {
 *   Alert.alert('Error', (error as Error).message);
 * }
 * ```
 *
 * Para escuchar los cambios de sesión (útil en el `_layout.tsx` raíz):
 *
 * ```tsx
 * useEffect(() => {
 *   const unsubscribe = onAuthStateChanged(auth, (user) => {
 *     if (user) router.replace('/');
 *     else router.replace('/login');
 *   });
 *   return unsubscribe;
 * }, []);
 * ```
 */
import type {
  AuthError,
  Session,
  User,
} from '@supabase/supabase-js';

import { supabase } from '@/db/supabase';

export type ProveedorAutenticacion = 'google' | 'email' | 'desconocido';

export async function obtenerProveedorAutenticacion(
  auth: SupabaseAuthClient,
): Promise<ProveedorAutenticacion> {
  const {
    data: { user },
    error,
  } = await auth.getUser();

  if (error || !user) return 'desconocido';

  const providers = user.app_metadata?.providers as string[] | undefined;
  if (providers?.includes('google')) return 'google';
  if (providers?.includes('email')) return 'email';

  const tieneGoogle = user.identities?.some((identity) => identity.provider === 'google');
  return tieneGoogle ? 'google' : 'email';
}

/** Cliente de autenticación de Supabase (`supabase.auth`). */
export type SupabaseAuthClient = typeof supabase.auth;

/** Usuario autenticado, equivalente al `User` de Firebase. */
export type AuthUser = User;

/** Sesión activa (incluye el token y el usuario). */
export type AuthSession = Session;

/** Resultado de crear una cuenta o iniciar sesión. */
export type UserCredential = {
  user: AuthUser;
  session: AuthSession | null;
};

/**
 * Credencial de email y contraseña, equivalente a la que devuelve
 * `EmailAuthProvider.credential(...)` en Firebase.
 */
export type EmailAuthCredential = {
  email: string;
  password: string;
};

/**
 * Reexporta el cliente para que puedas hacer:
 *
 * ```ts
 * import { auth, signInWithEmailAndPassword } from '@/features/auth/supabaseAuth';
 * ```
 */
export { auth } from '@/db/supabase';

/** Convierte el error de Supabase Auth en un `Error` legible con contexto. */
function lanzarError(accion: string, error: AuthError): never {
  throw new Error(`${accion}: ${error.message}`);
}

/**
 * Proveedor de email y contraseña.
 *
 * Construye la credencial que luego puedes pasar a
 * `reauthenticateWithCredential`, por ejemplo antes de cambiar la contraseña.
 *
 * ```ts
 * const credential = EmailAuthProvider.credential(email, password);
 * await reauthenticateWithCredential(auth, user, credential);
 * ```
 */
export const EmailAuthProvider = {
  credential(email: string, password: string): EmailAuthCredential {
    return { email: email.trim(), password };
  },
} as const;

/**
 * Crea una cuenta nueva con email y contraseña.
 *
 * Si en Supabase está activada la confirmación por correo, `session` será
 * `null` hasta que el usuario confirme su email.
 */
export async function createUserWithEmailAndPassword(
  auth: SupabaseAuthClient,
  email: string,
  password: string,
): Promise<UserCredential> {
  const { data, error } = await auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) lanzarError('No se pudo crear la cuenta', error);

  if (!data.user) {
    throw new Error(
      'No se pudo crear la cuenta: Supabase no devolvió el usuario. ' +
        'Comprueba si el email ya está registrado.',
    );
  }

  return { user: data.user, session: data.session };
}

/**
 * Inicia sesión con email y contraseña.
 *
 * ```ts
 * const { user, session } = await signInWithEmailAndPassword(auth, email, password);
 * ```
 */
export async function signInWithEmailAndPassword(
  auth: SupabaseAuthClient,
  email: string,
  password: string,
): Promise<UserCredential> {
  const { data, error } = await auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) lanzarError('No se pudo iniciar sesión', error);

  return { user: data.user, session: data.session };
}

/**
 * Vuelve a autenticar al usuario con su email y contraseña.
 *
 * Supabase no acepta un `User` ni una credencial de Firebase, así que se
 * vuelve a llamar a `signInWithPassword` con la credencial recibida. Esto
 * verifica la contraseña **y** renueva la sesión.
 *
 * El parámetro `user` se mantiene por compatibilidad con la firma de Firebase.
 */
export async function reauthenticateWithCredential(
  auth: SupabaseAuthClient,
  user: AuthUser,
  credential: EmailAuthCredential,
): Promise<UserCredential> {
  const { data, error } = await auth.signInWithPassword({
    email: credential.email.trim(),
    password: credential.password,
  });

  if (error) lanzarError('No se pudo verificar la contraseña', error);

  return { user: data.user ?? user, session: data.session };
}

/**
 * Envía un correo para restablecer la contraseña.
 *
 * `redirectTo` debe estar registrado en **Authentication → URL Configuration**
 * del panel de Supabase (o usar el deep link de la app), por ejemplo
 * `Linking.createURL('reset-password')`.
 */
export async function sendPasswordResetEmail(
  auth: SupabaseAuthClient,
  email: string,
  redirectTo?: string,
): Promise<void> {
  const { error } = await auth.resetPasswordForEmail(
    email.trim(),
    redirectTo ? { redirectTo } : undefined,
  );

  if (error) lanzarError('No se pudo enviar el correo de recuperación', error);
}

/**
 * Cierra la sesión del usuario en el dispositivo actual.
 */
export async function signOut(auth: SupabaseAuthClient): Promise<void> {
  const { error } = await auth.signOut();

  if (error) lanzarError('No se pudo cerrar la sesión', error);
}

/**
 * Cambia la contraseña del usuario autenticado.
 *
 * El parámetro `user` se mantiene por compatibilidad con la firma de Firebase;
 * Supabase toma el usuario de la sesión activa.
 *
 * Si el proyecto tiene activada la opción **Secure password change**, puede
 * ser necesario llamar antes a `reauthenticateWithCredential`.
 */
export async function updatePassword(
  auth: SupabaseAuthClient,
  user: AuthUser,
  newPassword: string,
): Promise<AuthUser> {
  const { data, error } = await auth.updateUser({ password: newPassword });

  if (error) lanzarError('No se pudo actualizar la contraseña', error);

  return data.user ?? user;
}

/**
 * Escucha los cambios de sesión (inicio de sesión, cierre, token renovado...).
 *
 * El callback recibe el usuario actual o `null` si no hay sesión.
 * Devuelve la función para desuscribirse:
 *
 * ```tsx
 * useEffect(() => onAuthStateChanged(auth, setUser), []);
 * ```
 */
export function onAuthStateChanged(
  auth: SupabaseAuthClient,
  callback: (user: AuthUser | null) => void,
): () => void {
  const { data } = auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
