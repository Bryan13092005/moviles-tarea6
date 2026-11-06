import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AuthUser } from '@/features/auth/supabaseAuth';

/**
 * Paleta de la tienda: azules profundos como base y verdes (claros y oscuros)
 * como color de marca y de acción.
 */
export const loginPalette = {
  background: '#050F1A',
  navy: '#081A2B',
  navySoft: '#0C2236',
  navyLine: '#183850',
  blueGlow: '#1268A8',
  text: '#F2F8F5',
  textMuted: '#8FA8BA',
  textDim: '#5C7A90',
  green: '#2FD68B',
  greenLight: '#A8F2C9',
  greenDark: '#0C3B2A',
  greenDeep: '#072A1E',
  danger: '#FF9A9A',
  dangerBg: '#34131C',
  white: '#FFFFFF',
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoadingAction = 'email' | 'google' | 'reset' | null;

export type LoginScreenProps = {
  /** Se ejecuta cuando el usuario inicia sesión correctamente. */
  onSignedIn?: (user: AuthUser) => void;
  /** Acción del enlace "Crear cuenta". */
  onCreateAccount?: () => void;
};

type AmbientGlowProps = {
  color: string;
  size: number;
  style: StyleProp<ViewStyle>;
};

function AmbientGlow({ color, size, style }: AmbientGlowProps) {
  return (
    <View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2 }, style]}
    >
      <View
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.07 }}
      />
      <View
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.06, transform: [{ scale: 0.66 }] }}
      />
      <View
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.07, transform: [{ scale: 0.38 }] }}
      />
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-[9px] font-bold tracking-[1.6px] text-app-text-muted">{children}</Text>
  );
}

const inputBase =
  'h-[54px] rounded-[15px] border px-4 text-[15px] tracking-[0.1px] text-[#F2F8F5]';

export function LoginScreen({ onSignedIn, onCreateAccount }: LoginScreenProps) {
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState<LoadingAction>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const isBusy = loading !== null;

  const clearMessages = () => {
    setError(null);
    setNotice(null);
  };

  const handleEmailSignIn = async () => {
    if (isBusy) return;

    clearMessages();

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      setError('Escribe tu correo y tu contraseña para continuar.');
      return;
    }

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError('Escribe un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading('email');

    try {
      // Se carga bajo demanda para no inicializar Supabase durante el render
      // estático en web (AsyncStorage necesita `window`).
      const { auth, signInWithEmailAndPassword } = await import('@/features/auth/supabaseAuth');
      const { user } = await signInWithEmailAndPassword(auth, cleanEmail, password);
      setPassword('');
      setNotice(`Sesión iniciada como ${user.email ?? cleanEmail}.`);
      onSignedIn?.(user);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBusy) return;

    clearMessages();
    setLoading('google');

    try {
      const { signInWithGoogle } = await import('@/features/auth/googleAuth');
      const result = await signInWithGoogle();

      if (!result) {
        setNotice('Inicio de sesión con Google cancelado.');
        return;
      }

      setNotice(`Sesión iniciada como ${result.user.email ?? 'tu cuenta de Google'}.`);
      onSignedIn?.(result.user);
    } catch (googleError) {
      setError(
        googleError instanceof Error ? googleError.message : 'No se pudo iniciar sesión con Google.',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (isBusy) return;

    clearMessages();

    const cleanEmail = email.trim();

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError('Escribe tu correo arriba para enviarte el enlace de recuperación.');
      return;
    }

    setLoading('reset');

    try {
      const { supabaseAdmin } = await import('@/db/supabase');
      if (supabaseAdmin) {
        const { data } = await supabaseAdmin.auth.admin.listUsers();
        const found = data?.users?.find(
          (u) => (u.email ?? '').toLowerCase() === cleanEmail.toLowerCase(),
        );
        const providers = (found?.app_metadata?.providers as string[] | undefined) ?? [];
        if (found && providers.includes('google')) {
          setError('Este correo usa Google; no se puede enviar correo de recuperación.');
          setLoading(null);
          return;
        }
      }

      const { auth, sendPasswordResetEmail } = await import('@/features/auth/supabaseAuth');
      await sendPasswordResetEmail(auth, cleanEmail);
      setNotice('Te enviamos un enlace para restablecer tu contraseña.');
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : 'No se pudo enviar el correo de recuperación.',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleCreateAccount = async () => {
    if (onCreateAccount) {
      onCreateAccount();
      return;
    }

    clearMessages();

    const cleanEmail = email.trim();

    if (!EMAIL_PATTERN.test(cleanEmail)) {
      setError('Escribe un correo válido para crear la cuenta.');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading('email');

    try {
      const { auth, createUserWithEmailAndPassword } = await import(
        '@/features/auth/supabaseAuth'
      );
      const { user, session } = await createUserWithEmailAndPassword(auth, cleanEmail, password);

      const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
      const identities = user.identities ?? [];
      const yaRegistrado =
        identities.length === 0 || providers.includes('google') || providers.length > 1;

      if (yaRegistrado) {
        setError(
          'Este correo ya está registrado' +
            (providers.includes('google') ? ' con Google.' : '.'),
        );
        await auth.signOut();
        return;
      }

      if (!session) {
        setNotice('Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.');
        return;
      }

      setNotice('Cuenta creada correctamente. Ya puedes iniciar sesión.');
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : 'No se pudo crear la cuenta.',
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-app-bg" style={{ flex: 1, backgroundColor: '#050F1A' }} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <AmbientGlow color="#2FD68B" size={430} style={{ top: -210, right: -170 }} />
        <AmbientGlow color="#1268A8" size={380} style={{ bottom: -200, left: -170 }} />
        <View
          className="absolute rounded-full border border-[rgba(47,214,139,0.18)]"
          style={{ top: -120, right: -80, width: 300, height: 300 }}
        />
        <View
          className="absolute rounded-full border border-[rgba(18,104,168,0.28)]"
          style={{ bottom: -80, left: -70, width: 230, height: 230 }}
        />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-115 self-center">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-3">
                <View
                  className="h-11.5 w-11.5tems-center justify-center rounded-[15px] bg-app-green"
                  style={{
                    shadowColor: '#2FD68B',
                    shadowOpacity: 0.35,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 5,
                  }}
                >
                  <Text className="text-[23px] font-black tracking-[-1px] text-app-green-deep">N</Text>
                </View>
                <View>
                  <Text className="text-[17px] font-extrabold tracking-[4px] text-app-text">NEXO</Text>
                  <Text className="mt-0.5 text-[9px] font-bold tracking-[2.6px] text-app-text-dim">
                    TECH STORE
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5 rounded-full border border-[rgba(47,214,139,0.28)] bg-[rgba(12,59,42,0.45)] px-2.5 py-1.5">
                <View className="h-1.5 w-1.5 rounded-[3px] bg-app-green" />
                <Text className="text-[9px] font-bold tracking-[1.4px] text-app-green-light">EN LÍNEA</Text>
              </View>
            </View>

            <View className="mt-10.5 mb-7">
              <View className="flex-row items-center gap-2 self-start rounded-full border border-[rgba(168,242,201,0.22)] bg-[rgba(7,42,30,0.55)] px-2.75 py-1.75">
                <View className="h-1.25 w-1.25 rounded-[3px] bg-app-green-light" />
                <Text className="text-[9px] font-bold tracking-[1.5px] text-app-green-light">
                  NUEVA COLECCIÓN 2026
                </Text>
              </View>

              <Text className="mt-4.5 text-[38px] font-extrabold leading-10.75 tracking-[-1.6px] text-app-text">
                Bienvenido{'\n'}
                <Text className="text-app-green-light">de nuevo.</Text>
              </Text>

              <Text className="mt-3 max-w-82.5 text-[14px] leading-5.25 tracking-[0.1px] text-app-text-muted">
                Inicia sesión para seguir comprando lo último en tecnología.
              </Text>
            </View>

            <View
              className="rounded-[26px] border border-[rgba(24,56,80,0.9)] bg-[rgba(9,27,43,0.94)] p-5"
              style={{
                shadowColor: '#000000',
                shadowOpacity: 0.4,
                shadowRadius: 26,
                shadowOffset: { width: 0, height: 18 },
                elevation: 10,
              }}
            >
              <View className="mb-4 flex-row items-center justify-between gap-2.5">
                <Text className="text-[9px] font-extrabold tracking-[1.8px] text-app-green-light">
                  ACCESO A TU CUENTA
                </Text>
                <Text className="text-[11px] text-app-text-dim">Es rápido y seguro</Text>
              </View>

              {error ? (
                <View
                  className="mb-3.5 rounded-xl border border-[rgba(255,154,154,0.32)] bg-app-danger-bg px-3 py-2.5"
                  accessibilityLiveRegion="polite"
                >
                  <Text className="text-[12px] leading-4.25 text-app-danger">{error}</Text>
                </View>
              ) : null}

              {notice ? (
                <View
                  className="mb-3.5 rounded-xl border border-[rgba(47,214,139,0.32)] bg-[rgba(12,59,42,0.75)] px-3 py-2.5"
                  accessibilityLiveRegion="polite"
                >
                  <Text className="text-[12px] leading-4.25 text-app-green-light">{notice}</Text>
                </View>
              ) : null}

              <View className="mb-3.5">
                <FieldLabel>CORREO ELECTRÓNICO</FieldLabel>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="tu@correo.com"
                  placeholderTextColor="#5C7A90"
                  className={`${inputBase} ${
                    focusedField === 'email'
                      ? 'border-app-green bg-app-navy-soft'
                      : 'border-app-navy-line bg-app-navy'
                  }`}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  selectionColor="#2FD68B"
                  keyboardAppearance="dark"
                  editable={!isBusy}
                  accessibilityLabel="Correo electrónico"
                />
              </View>

              <View className="mb-3.5">
                <FieldLabel>CONTRASEÑA</FieldLabel>
                <View className="relative">
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={handleEmailSignIn}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#5C7A90"
                    className={`${inputBase} pr-21.5 ${
                      focusedField === 'password'
                        ? 'border-app-green bg-app-navy-soft'
                        : 'border-app-navy-line bg-app-navy'
                    }`}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    selectionColor="#2FD68B"
                    keyboardAppearance="dark"
                    editable={!isBusy}
                    accessibilityLabel="Contraseña"
                  />
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={10}
                    className="absolute right-3.5 top-0 bottom-0 justify-center"
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <Text className="text-[9px] font-extrabold tracking-[1.2px] text-app-green">
                      {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="mt-0.5 mb-4.5 flex-row items-center justify-between gap-3">
                <Pressable
                  onPress={() => setRemember((current) => !current)}
                  hitSlop={8}
                  className="flex-row items-center gap-2"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: remember }}
                  accessibilityLabel="Recordarme"
                >
                  <View
                    className={`h-4.75 w-4.75 items-center justify-center rounded-md border ${
                      remember ? 'border-app-green bg-app-green' : 'border-app-navy-line bg-app-navy'
                    }`}
                  >
                    {remember ? (
                      <Text className="text-[12px] font-black leading-3.75 text-app-green-deep">✓</Text>
                    ) : null}
                  </View>
                  <Text className="text-[12px] text-app-text-muted">Recordarme</Text>
                </Pressable>

                <Pressable
                  onPress={handleForgotPassword}
                  hitSlop={8}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Olvidé mi contraseña"
                >
                  <Text className={`text-[12px] font-semibold text-app-green-light ${isBusy ? 'opacity-50' : ''}`}>
                    {loading === 'reset' ? 'Enviando…' : '¿Olvidaste tu contraseña?'}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleEmailSignIn}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
                className="h-14"
              >
                {({ pressed }) => (
                  <View
                    className={`h-14 items-center justify-center rounded-[17px] ${
                      pressed && !isBusy ? 'bg-app-green' : 'bg-app-green-light'
                    } ${isBusy && loading !== 'email' ? 'opacity-[0.55]' : ''}`}
                    style={[
                      pressed && !isBusy ? { transform: [{ scale: 0.99 }] } : null,
                      {
                        shadowColor: '#2FD68B',
                        shadowOpacity: 0.3,
                        shadowRadius: 18,
                        shadowOffset: { width: 0, height: 10 },
                        elevation: 6,
                      },
                    ]}
                  >
                    {loading === 'email' ? (
                      <ActivityIndicator color="#072A1E" />
                    ) : (
                      <Text className="text-[15px] font-extrabold tracking-[0.4px] text-app-green-deep">
                        Iniciar sesión
                      </Text>
                    )}
                  </View>
                )}
              </Pressable>

              <View className="my-4.5 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-[rgba(143,168,186,0.16)]" />
                <Text className="text-[10px] tracking-[0.6px] text-app-text-dim">o continúa con</Text>
                <View className="h-px flex-1 bg-[rgba(143,168,186,0.16)]" />
              </View>

              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Continuar con Google"
                className="h-13.5"
              >
                {({ pressed }) => (
                  <View
                    className={`h-13.5 flex-row items-center justify-center gap-2.5 rounded-[17px] border ${
                      pressed && !isBusy
                        ? 'border-[rgba(47,214,139,0.4)] bg-app-navy-soft'
                        : 'border-app-navy-line bg-app-navy'
                    } ${isBusy && loading !== 'google' ? 'opacity-[0.55]' : ''}`}
                  >
                    {loading === 'google' ? (
                      <ActivityIndicator color="#A8F2C9" />
                    ) : (
                      <>
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-[#FFFFFF]">
                          <Text className="text-[14px] font-black leading-4.5 text-[#1A73E8]">G</Text>
                        </View>
                        <Text className="text-[14px] font-semibold text-app-text">
                          Continuar con Google
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </Pressable>
            </View>

            <View className="mt-5.5 flex-row items-center justify-center gap-1.5">
              <Text className="text-[13px] text-app-text-muted">¿No tienes cuenta?</Text>
              <Pressable
                onPress={handleCreateAccount}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Crear cuenta"
              >
                <Text className="text-[13px] font-bold text-app-green-light">Crear cuenta</Text>
              </Pressable>
            </View>

            <Text className="mt-4.5 px-3 text-center text-[10px] leading-3.75 text-app-text-dim">
              Conexión cifrada · Al continuar aceptas los términos de servicio y la
              política de privacidad.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}