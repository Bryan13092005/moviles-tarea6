/**
 * Autenticación con Google (OAuth 2.0) usando Supabase.
 *
 * Flujo nativo (Expo / React Native):
 *
 * 1. `supabase.auth.signInWithOAuth({ provider: 'google' })` genera la URL de
 *    Google (`skipBrowserRedirect: true` evita que se abra el navegador del
 *    sistema por su cuenta).
 * 2. `WebBrowser.openAuthSessionAsync` abre esa URL en una pestaña segura
 *    (Custom Tabs en Android / Safari View Controller en iOS).
 * 3. Google redirige a Supabase, y Supabase redirige a la app mediante el
 *    deep link `tarea6://auth/callback`.
 * 4. Se leen los tokens (o el `code` si usas PKCE) y se crea la sesión.
 *
 * ---------------------------------------------------------------------------
 * Configuración necesaria (una sola vez, fuera del código)
 * ---------------------------------------------------------------------------
 *
 * 1. **Google Cloud Console** → APIs & Services → Credentials:
 *    crea un *OAuth client ID* de tipo **Web application** y agrega como
 *    *Authorized redirect URI*:
 *
 *      https://<project-ref>.supabase.co/auth/v1/callback
 *
 * 2. **Supabase Dashboard** → Authentication → Providers → **Google**:
 *    actívalo y pega el *Client ID* y el *Client Secret* de Google.
 *
 * 3. **Supabase Dashboard** → Authentication → URL Configuration →
 *    **Redirect URLs**, agrega el deep link de la app:
 *
 *      tarea6://auth/callback     (build de desarrollo/producción)
 *      exp://**                   (Expo Go durante el desarrollo)
 *      http://localhost:8081/**   (web en desarrollo)
 *
 *    ⚠️ Supabase **solo** respeta el `redirectTo` que recibe si coincide con
 *    una de estas URLs (admite comodines `*` y `**`). Si no coincide, ignora
 *    el valor del código y redirige al **Site URL** del panel (por defecto
 *    `http://localhost:8081`): ese es el motivo habitual de que el login
 *    termine en `localhost:8081` en vez de volver a la app.
 *
 * 4. El esquema `tarea6` ya está declarado en `app.json` (`"scheme": "tarea6"`).
 *    Si lo cambias, cambia también `OAUTH_CALLBACK_PATH` si hace falta.
 *
 * ---------------------------------------------------------------------------
 * Uso
 * ---------------------------------------------------------------------------
 *
 * ```tsx
 * import { signInWithGoogle } from '@/features/auth/googleAuth';
 *
 * const handleGoogleLogin = async () => {
 *   try {
 *     const resultado = await signInWithGoogle();
 *     if (!resultado) return; // el usuario cerró la pestaña
 *     console.log('Sesión iniciada', resultado.user.email);
 *   } catch (error) {
 *     Alert.alert('Error', (error as Error).message);
 *   }
 * };
 * ```
 */
import 'react-native-url-polyfill/auto';

import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/db/supabase';
import type { UserCredential } from '@/features/auth/supabaseAuth';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();
/** Esquema declarado en `app.json` (`expo.scheme`). */
export const APP_SCHEME = 'tarea6';
/** Ruta del deep link a la que Supabase devuelve al usuario. */
export const OAUTH_CALLBACK_PATH = 'auth/callback';
/** Deep link estable de un development build o standalone. */
export const NATIVE_REDIRECT_URL = `${APP_SCHEME}://${OAUTH_CALLBACK_PATH}`;

/**
 * URL de redirección que se envía a Supabase y se espera en el navegador.
 *
 * En desarrollo (Expo Go) devuelve algo como
 * `exp://192.168.1.10:8081/--/auth/callback`; en un build nativo devuelve
 * `tarea6://auth/callback`; en web, `http://localhost:8081/auth/callback`.
 *
 * Recuerda que la URL resultante debe estar registrada en
 * **Authentication → URL Configuration → Redirect URLs** de Supabase; si no,
 * Supabase usa el Site URL del panel. En desarrollo puedes fijar una URL
 * concreta con `EXPO_PUBLIC_AUTH_REDIRECT_URL` en el `.env` (útil para web o
 * para probar con una URL exacta ya registrada).
 *
 * La ruta `src/app/auth/callback.tsx` completa la sesión cuando el navegador
 * o el sistema abren la app con esta URL.
 */
export function getOAuthRedirectUrl(): string {
  const override = process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (override) {
    if (__DEV__) {
      console.log('[auth] redirectTo (override):', override);
    }
    return override;
  }

  const url = makeRedirectUri({
    scheme: APP_SCHEME,
    path: OAUTH_CALLBACK_PATH,
    // Fija el deep link de los development builds / standalone para que no
    // incluya el host del servidor de Metro y coincida con la lista blanca.
    // En Expo Go se ignora y se devuelve `exp://<host>:8081/--/auth/callback`.
    native: NATIVE_REDIRECT_URL,
  });

  if (__DEV__) {
    console.log(
      '[auth] redirectTo enviado a Supabase:',
      url,
      '\n[auth] Esta URL exacta (o un patrón que la cubra) debe existir en ' +
        'Supabase → Authentication → URL Configuration → Redirect URLs. ' +
        'Si no, Supabase redirigirá al Site URL. Para Expo Go añade ' +
        '`exp://**`; para un build nativo, `' +
        NATIVE_REDIRECT_URL +
        '`.',
    );
  }

  return url;
}

/**
 * Configuración del proveedor de Google para `signInWithOAuth`.
 *
 * No se envían `prompt` ni `access_type`: el selector de cuentas de Google
 * puede auto-redirigir mientras el usuario hace clic y provocar que Supabase
 * reciba el callback dos veces. El primero consume el `state` y el segundo
 * falla con "OAuth state not found or expired". Para un login normal tampoco
 * hace falta el refresh token del proveedor (`access_type=offline`).
 */
export function getGoogleProviderOptions() {
  return {
    provider: 'google' as const,
    options: {
      redirectTo: getOAuthRedirectUrl(),
      skipBrowserRedirect: true,
    },
  };
}

/**
 * Inicia sesión con Google.
 *
 * Devuelve `null` si el usuario cancela o cierra la pestaña de autenticación;
 * lanza un `Error` si algo falla.
 */
export function signInWithGoogle(): Promise<UserCredential | null> {
  // Un doble toque en el botón abriría dos sesiones de OAuth a la vez: la
  // primera consume el `state` en Supabase y la segunda termina con
  // "OAuth state not found or expired". Compartir la misma promesa evita eso.
  if (inFlightSignIn) {
    return inFlightSignIn;
  }

  inFlightSignIn = signInWithGoogleOnce().finally(() => {
    inFlightSignIn = null;
  });

  return inFlightSignIn;
}

let inFlightSignIn: Promise<UserCredential | null> | null = null;

async function signInWithGoogleOnce(): Promise<UserCredential | null> {
  const { provider, options } = getGoogleProviderOptions();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options,
  });

  if (error) {
    throw new Error(`No se pudo iniciar sesión con Google: ${error.message}`);
  }

  if (!data.url) {
    throw new Error(
      'No se pudo iniciar sesión con Google: Supabase no devolvió la URL de autorización.',
    );
  }

  const resultado = await WebBrowser.openAuthSessionAsync(
    data.url,
    options.redirectTo,
  );

  if (resultado.type !== 'success') {
    // 'cancel' | 'dismiss' | 'locked' → el usuario no completó el flujo.
    return null;
  }

  return completeGoogleSignIn(resultado.url);
}

/**
 * Termina el inicio de sesión a partir de la URL de redirección.
 *
 * Útil cuando la app recibe el deep link por su cuenta (por ejemplo en web o
 * con `Linking.useURL()`), en lugar de usar `signInWithGoogle`.
 *
 * Soporta los dos flujos de Supabase:
 * - **PKCE**: la URL trae `?code=...` y se canjea con `exchangeCodeForSession`.
 * - **Implicit**: la URL trae `#access_token=...&refresh_token=...` y se llama
 *   a `setSession`.
 *
 * ```ts
 * const url = Linking.useURL();
 * useEffect(() => {
 *   if (url) completeGoogleSignIn(url).catch(console.error);
 * }, [url]);
 * ```
 */
export async function completeGoogleSignIn(
  url: string,
): Promise<UserCredential> {
  // El deep link puede llegar dos veces (p. ej. `openAuthSessionAsync` lo
  // devuelve y además el sistema abre la app en `/auth/callback`). Reutilizar
  // el resultado evita canjear el mismo `code` o token dos veces.
  if (lastCompleted?.url === url) {
    return lastCompleted.credential;
  }

  // Si las dos llamadas llegan a la vez, comparten la misma promesa; con PKCE
  // un segundo `exchangeCodeForSession` fallaría porque el código es de un
  // solo uso.
  if (inFlightCompletion?.url === url) {
    return inFlightCompletion.promise;
  }

  const promise = completeGoogleSignInOnce(url);
  inFlightCompletion = { url, promise };

  try {
    const credential = await promise;
    lastCompleted = { url, credential };
    return credential;
  } finally {
    if (inFlightCompletion?.promise === promise) {
      inFlightCompletion = null;
    }
  }
}

/** Última URL completada, para no procesar el mismo deep link dos veces. */
let lastCompleted: { url: string; credential: UserCredential } | null = null;
/** Canje en curso, para que dos llamadas simultáneas no consuman el código. */
let inFlightCompletion: {
  url: string;
  promise: Promise<UserCredential>;
} | null = null;

async function completeGoogleSignInOnce(
  url: string,
): Promise<UserCredential> {
  const parsed = new URL(url);
  const query = parsed.searchParams;
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));

  const oauthError = query.get('error') ?? fragment.get('error');
  if (oauthError) {
    const description =
      query.get('error_description') ?? fragment.get('error_description');
    const message = description ?? oauthError;

    // Si Google/Supabase procesó el callback dos veces, el primero ya creó la
    // sesión y el segundo solo trae un error de "state consumido". En ese caso
    // la sesión válida ya está guardada: se reutiliza en lugar de fallar.
    if (/state not found or expired|state has already been used/i.test(message)) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        if (__DEV__) {
          console.warn(
            '[auth] Callback duplicado: Supabase consumió el estado en el primer callback. ' +
              'La sesión ya existe, así que se reutiliza.',
          );
        }
        return { user: data.session.user, session: data.session };
      }
    }

    throw new Error(`No se pudo iniciar sesión con Google: ${message}`);
  }

  // Flujo PKCE (recomendado): Supabase redirige con ?code=...
  const code = query.get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw new Error(
        `No se pudo completar el inicio de sesión con Google: ${error.message}`,
      );
    }

    if (!data.user || !data.session) {
      throw new Error(
        'No se pudo completar el inicio de sesión con Google: Supabase no devolvió la sesión.',
      );
    }

    return { user: data.user, session: data.session };
  }

  // Flujo implícito (predeterminado): los tokens vienen en el fragmento #.
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');

  if (!accessToken || !refreshToken) {
    throw new Error(
      'No se pudo completar el inicio de sesión con Google: la URL de redirección no contiene los tokens de sesión.',
    );
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    throw new Error(
      `No se pudo completar el inicio de sesión con Google: ${error.message}`,
    );
  }

  if (!data.user || !data.session) {
    throw new Error(
      'No se pudo completar el inicio de sesión con Google: Supabase no devolvió la sesión.',
    );
  }

  return { user: data.user, session: data.session };
}
