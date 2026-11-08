import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
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

import { LottieButton } from '@/components/ui/LottieButton';
import { GoogleButton } from '@/components/ui/GoogleButton';
import type { AuthUser } from '@/features/auth/supabaseAuth';
import { useAlertSystem } from '@/features/alerts/useAlertSystem';
import { useFormValidation } from '@/features/validation/useFormValidation';
import { validationRuleCombinations } from '@/features/validation/validationRules';

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
  const { alertError, alertSuccess, alertWarning } = useAlertSystem();

  // Validación en tiempo real
  const validation = useFormValidation({
    email: validationRuleCombinations.loginEmail,
    password: validationRuleCombinations.loginPassword,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [loading, setLoading] = useState<LoadingAction>(null);

  const emailState = validation.getFieldState('email');
  const passwordState = validation.getFieldState('password');

  const isEmailError = Boolean(emailState.isTouched && emailState.error);
  const isEmailSuccess = Boolean(emailState.isTouched && emailState.isValid && email.trim().length > 0);
  const emailBorderClass = isEmailError
    ? 'border-app-danger bg-app-navy'
    : isEmailSuccess
      ? 'border-app-green bg-app-navy'
      : focusedField === 'email'
        ? 'border-app-green bg-app-navy-soft'
        : 'border-app-navy-line bg-app-navy';

  const isPasswordError = Boolean(passwordState.isTouched && passwordState.error);
  const isPasswordSuccess = Boolean(passwordState.isTouched && passwordState.isValid && password.length >= 6);
  const passwordBorderClass = isPasswordError
    ? 'border-app-danger bg-app-navy'
    : isPasswordSuccess
      ? 'border-app-green bg-app-navy'
      : focusedField === 'password'
        ? 'border-app-green bg-app-navy-soft'
        : 'border-app-navy-line bg-app-navy';

  const isBusy = loading !== null;

  const handleEmailSignIn = async () => {
    if (isBusy) return;

    const cleanEmail = email.trim();
    const isValid = validation.validateAll({ email: cleanEmail, password });

    // Usar validación del hook
    if (!isValid) {
      const errors = validation.getFormErrors();
      const firstError = Object.values(errors)[0];
      if (firstError) {
        alertWarning(firstError, 'invalidCredentials');
      } else {
        alertWarning('Verifica que todos los campos sean correctos.', 'invalidCredentials');
      }
      return;
    }

    setLoading('email');

    try {
      const { auth, signInWithEmailAndPassword } = await import('@/features/auth/supabaseAuth');
      const { user } = await signInWithEmailAndPassword(auth, cleanEmail, password);
      setPassword('');
      validation.resetAll();
      alertSuccess(
        `Sesión iniciada como ${user.email ?? cleanEmail}.`,
        'correctCredentials',
        4000,
        true
      );
      onSignedIn?.(user);
    } catch (signInError) {
      const errorMsg = signInError instanceof Error ? signInError.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
      alertError(errorMsg, 'invalidCredentials');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isBusy) return;

    setLoading('google');

    try {
      const { signInWithGoogle } = await import('@/features/auth/googleAuth');
      const result = await signInWithGoogle();

      if (!result) {
        alertWarning('Inicio de sesión con Google cancelado.', 'invalidCredentials');
        return;
      }

      alertSuccess(
        `Sesión iniciada como ${result.user.email ?? 'tu cuenta de Google'}.`,
        'correctCredentials',
        4000,
        true
      );
      onSignedIn?.(result.user);
    } catch (googleError) {
      const errorMsg = googleError instanceof Error ? googleError.message : 'No se pudo iniciar sesión con Google.';
      alertError(errorMsg, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (isBusy) return;

    const cleanEmail = email.trim();
    const emailCheck = validation.validateField('email', cleanEmail);

    if (!emailCheck.isValid) {
      validation.handleFieldBlur('email', cleanEmail);
      alertWarning(
        emailCheck.error || 'Escribe tu correo arriba para enviarte el enlace de recuperación.',
        'invalidCredentials'
      );
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
          alertError('Este correo usa Google; no se puede enviar correo de recuperación.', 'error');
          setLoading(null);
          return;
        }
      }

      const { auth, sendPasswordResetEmail } = await import('@/features/auth/supabaseAuth');
      await sendPasswordResetEmail(auth, cleanEmail);
      alertSuccess('Te enviamos un enlace para restablecer tu contraseña.', 'changeanresetpassword', 4000, true);
    } catch (resetError) {
      const errorMsg = resetError instanceof Error ? resetError.message : 'No se pudo enviar el correo de recuperación.';
      alertError(errorMsg, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleCreateAccount = async () => {
    if (onCreateAccount) {
      onCreateAccount();
      return;
    }

    const cleanEmail = email.trim();
    const isValid = validation.validateAll({ email: cleanEmail, password });

    if (!isValid) {
      const errors = validation.getFormErrors();
      const firstError = Object.values(errors)[0];
      alertWarning(firstError || 'Verifica que todos los campos sean correctos.', 'invalidCredentials');
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
        alertError(
          'Este correo ya está registrado' + (providers.includes('google') ? ' con Google.' : '.'),
          'error'
        );
        await auth.signOut();
        return;
      }

      if (!session) {
        alertSuccess('Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesión.', 'correct', 4000, true);
        return;
      }

      alertSuccess('¡Cuenta creada exitosamente!\nBienvenido a nuestro marketplace', 'correct', 4000, true);
    } catch (createError) {
      const errorMsg = createError instanceof Error ? createError.message : 'No se pudo crear la cuenta.';
      alertError(errorMsg, 'error');
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
            <View className="mt-10.5 mb-7">
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

              <View className="mb-3.5">
                <FieldLabel>CORREO ELECTRÓNICO</FieldLabel>
                <View className="relative justify-center">
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      validation.handleFieldChange('email', text);
                    }}
                    onFocus={() => {
                      setFocusedField('email');
                      validation.handleFieldFocus('email');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      validation.handleFieldBlur('email', email);
                    }}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    placeholder="tu@correo.com"
                    placeholderTextColor="#5C7A90"
                    className={`${inputBase} pr-10 ${emailBorderClass}`}
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
                  {emailState.isTouched && email.length > 0 && (
                    <View
                      pointerEvents="none"
                      className="absolute right-3.5 top-0 bottom-0 justify-center"
                    >
                      <Text
                        className={`text-[13px] font-extrabold ${
                          isEmailError ? 'text-app-danger' : 'text-app-green'
                        }`}
                      >
                        {isEmailError ? '✕' : '✓'}
                      </Text>
                    </View>
                  )}
                </View>
                {/* Mensaje de error o éxito debajo del campo */}
                {isEmailError ? (
                  <Text
                    className="mt-1.5 text-[12px] font-medium leading-4 text-app-danger"
                    accessibilityRole="alert"
                  >
                    {emailState.error}
                  </Text>
                ) : isEmailSuccess ? (
                  <Text className="mt-1.5 text-[12px] font-medium leading-4 text-app-green">
                    ✓ Formato de correo válido
                  </Text>
                ) : null}
              </View>

              <View className="mb-3.5">
                <FieldLabel>CONTRASEÑA</FieldLabel>
                <View className="relative">
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      validation.handleFieldChange('password', text);
                    }}
                    onFocus={() => {
                      setFocusedField('password');
                      validation.handleFieldFocus('password');
                    }}
                    onBlur={() => {
                      setFocusedField(null);
                      validation.handleFieldBlur('password', password);
                    }}
                    onSubmitEditing={handleEmailSignIn}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#5C7A90"
                    className={`${inputBase} pr-21.5 ${passwordBorderClass}`}
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
                {/* Mensaje de validación debajo del campo */}
                {isPasswordError ? (
                  <Text
                    className="mt-1.5 text-[12px] font-medium leading-4 text-app-danger"
                    accessibilityRole="alert"
                  >
                    {passwordState.error}
                  </Text>
                ) : isPasswordSuccess ? (
                  <Text className="mt-1.5 text-[12px] font-medium leading-4 text-app-green">
                    ✓ Contraseña válida
                  </Text>
                ) : null}
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

              <LottieButton
                animation="loginandlogout"
                label={loading === 'email' ? 'Iniciando…' : 'Iniciar sesión'}
                onPress={handleEmailSignIn}
                busy={loading === 'email'}
                disabled={isBusy}
                className="h-14 w-full"
              />

              <View className="my-4.5 flex-row items-center gap-3">
                <View className="h-px flex-1 bg-[rgba(143,168,186,0.16)]" />
                <Text className="text-[10px] tracking-[0.6px] text-app-text-dim">o continúa con</Text>
                <View className="h-px flex-1 bg-[rgba(143,168,186,0.16)]" />
              </View>

              <GoogleButton
                label={loading === 'google' ? 'Iniciando…' : 'Continuar con Google'}
                onPress={handleGoogleSignIn}
                busy={loading === 'google'}
                disabled={isBusy}
                className="h-13.5 w-full"
              />
            </View>

            <View className="mt-5.5 flex-row items-center justify-center gap-1.5">
              <Text className="text-[13px] text-app-text-muted">¿No tienes cuenta?</Text>
              <LottieButton
                animation="newUser"
                label="Crear cuenta"
                onPress={handleCreateAccount}
                compact
              />
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