import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
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
      style={[
        styles.glow,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <View style={[styles.glowLayer, { backgroundColor: color, opacity: 0.07 }]} />
      <View
        style={[
          styles.glowLayer,
          { backgroundColor: color, opacity: 0.06, transform: [{ scale: 0.66 }] },
        ]}
      />
      <View
        style={[
          styles.glowLayer,
          { backgroundColor: color, opacity: 0.07, transform: [{ scale: 0.38 }] },
        ]}
      />
    </View>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

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
      const { auth, signInWithEmailAndPassword } = await import(
        '@/features/auth/supabaseAuth'
      );
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

      setNotice(
        `Sesión iniciada como ${result.user.email ?? 'tu cuenta de Google'}.`,
      );
      onSignedIn?.(result.user);
    } catch (googleError) {
      setError(
        googleError instanceof Error
          ? googleError.message
          : 'No se pudo iniciar sesión con Google.',
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
      const { auth, sendPasswordResetEmail } = await import(
        '@/features/auth/supabaseAuth'
      );
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

  const handleCreateAccount = () => {
    if (onCreateAccount) {
      onCreateAccount();
      return;
    }

    clearMessages();
    setNotice('La creación de cuentas estará disponible muy pronto.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop]}>
        <AmbientGlow color={loginPalette.green} size={430} style={styles.glowTop} />
        <AmbientGlow color={loginPalette.blueGlow} size={380} style={styles.glowBottom} />
        <View style={[styles.ring, styles.ringTop]} />
        <View style={[styles.ring, styles.ringBottom]} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.brand}>
                <View style={styles.brandMark}>
                  <Text style={styles.brandMarkText}>N</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>NEXO</Text>
                  <Text style={styles.brandTag}>TECH STORE</Text>
                </View>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>EN LÍNEA</Text>
              </View>
            </View>

            <View style={styles.hero}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>NUEVA COLECCIÓN 2026</Text>
              </View>

              <Text style={styles.title}>
                Bienvenido{'\n'}
                <Text style={styles.titleAccent}>de nuevo.</Text>
              </Text>

              <Text style={styles.subtitle}>
                Inicia sesión para seguir comprando lo último en tecnología.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardEyebrow}>ACCESO A TU CUENTA</Text>
                <Text style={styles.cardHint}>Es rápido y seguro</Text>
              </View>

              {error ? (
                <View
                  style={[styles.banner, styles.bannerError]}
                  accessibilityLiveRegion="polite"
                >
                  <Text style={styles.bannerErrorText}>{error}</Text>
                </View>
              ) : null}

              {notice ? (
                <View
                  style={[styles.banner, styles.bannerSuccess]}
                  accessibilityLiveRegion="polite"
                >
                  <Text style={styles.bannerSuccessText}>{notice}</Text>
                </View>
              ) : null}

              <View style={styles.field}>
                <FieldLabel>CORREO ELECTRÓNICO</FieldLabel>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="tu@correo.com"
                  placeholderTextColor={loginPalette.textDim}
                  style={[
                    styles.input,
                    focusedField === 'email' && styles.inputFocused,
                  ]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  selectionColor={loginPalette.green}
                  keyboardAppearance="dark"
                  editable={!isBusy}
                  accessibilityLabel="Correo electrónico"
                />
              </View>

              <View style={styles.field}>
                <FieldLabel>CONTRASEÑA</FieldLabel>
                <View style={styles.passwordWrap}>
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onSubmitEditing={handleEmailSignIn}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={loginPalette.textDim}
                    style={[
                      styles.input,
                      styles.passwordInput,
                      focusedField === 'password' && styles.inputFocused,
                    ]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    selectionColor={loginPalette.green}
                    keyboardAppearance="dark"
                    editable={!isBusy}
                    accessibilityLabel="Contraseña"
                  />
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={10}
                    style={styles.visibilityButton}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                    }
                  >
                    <Text style={styles.visibilityText}>
                      {showPassword ? 'OCULTAR' : 'MOSTRAR'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.optionsRow}>
                <Pressable
                  onPress={() => setRemember((current) => !current)}
                  hitSlop={8}
                  style={styles.rememberRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: remember }}
                  accessibilityLabel="Recordarme"
                >
                  <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                    {remember ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                  <Text style={styles.rememberText}>Recordarme</Text>
                </Pressable>

                <Pressable
                  onPress={handleForgotPassword}
                  hitSlop={8}
                  disabled={isBusy}
                  accessibilityRole="button"
                  accessibilityLabel="Olvidé mi contraseña"
                >
                  <Text style={[styles.link, isBusy && styles.linkDisabled]}>
                    {loading === 'reset' ? 'Enviando…' : '¿Olvidaste tu contraseña?'}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleEmailSignIn}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isBusy && styles.primaryButtonPressed,
                  isBusy && loading !== 'email' && styles.buttonMuted,
                ]}
              >
                {loading === 'email' ? (
                  <ActivityIndicator color={loginPalette.greenDeep} />
                ) : (
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o continúa con</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                onPress={handleGoogleSignIn}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Continuar con Google"
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && !isBusy && styles.googleButtonPressed,
                  isBusy && loading !== 'google' && styles.buttonMuted,
                ]}
              >
                {loading === 'google' ? (
                  <ActivityIndicator color={loginPalette.greenLight} />
                ) : (
                  <>
                    <View style={styles.googleMark}>
                      <Text style={styles.googleMarkText}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>Continuar con Google</Text>
                  </>
                )}
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta?</Text>
              <Pressable
                onPress={handleCreateAccount}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Crear cuenta"
              >
                <Text style={styles.footerLink}>Crear cuenta</Text>
              </Pressable>
            </View>

            <Text style={styles.legal}>
              Conexión cifrada · Al continuar aceptas los términos de servicio y la
              política de privacidad.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: loginPalette.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  content: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  backdrop: {
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 9999,
  },
  glowTop: {
    top: -210,
    right: -170,
  },
  glowBottom: {
    bottom: -200,
    left: -170,
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  ringTop: {
    top: -120,
    right: -80,
    width: 300,
    height: 300,
    borderColor: 'rgba(47, 214, 139, 0.18)',
  },
  ringBottom: {
    bottom: -80,
    left: -70,
    width: 230,
    height: 230,
    borderColor: 'rgba(18, 104, 168, 0.28)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: loginPalette.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: loginPalette.green,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  brandMarkText: {
    color: loginPalette.greenDeep,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandName: {
    color: loginPalette.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 4,
  },
  brandTag: {
    marginTop: 2,
    color: loginPalette.textDim,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 139, 0.28)',
    backgroundColor: 'rgba(12, 59, 42, 0.45)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: loginPalette.green,
  },
  statusText: {
    color: loginPalette.greenLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  hero: {
    marginTop: 42,
    marginBottom: 28,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168, 242, 201, 0.22)',
    backgroundColor: 'rgba(7, 42, 30, 0.55)',
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: loginPalette.greenLight,
  },
  badgeText: {
    color: loginPalette.greenLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 18,
    color: loginPalette.text,
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '800',
    letterSpacing: -1.6,
  },
  titleAccent: {
    color: loginPalette.greenLight,
  },
  subtitle: {
    marginTop: 12,
    maxWidth: 330,
    color: loginPalette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  card: {
    padding: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(24, 56, 80, 0.9)',
    backgroundColor: 'rgba(9, 27, 43, 0.94)',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  cardEyebrow: {
    color: loginPalette.greenLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  cardHint: {
    color: loginPalette.textDim,
    fontSize: 11,
  },
  banner: {
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerError: {
    backgroundColor: loginPalette.dangerBg,
    borderColor: 'rgba(255, 154, 154, 0.32)',
  },
  bannerErrorText: {
    color: loginPalette.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(12, 59, 42, 0.75)',
    borderColor: 'rgba(47, 214, 139, 0.32)',
  },
  bannerSuccessText: {
    color: loginPalette.greenLight,
    fontSize: 12,
    lineHeight: 17,
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    marginBottom: 8,
    color: loginPalette.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  input: {
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: loginPalette.navyLine,
    backgroundColor: loginPalette.navy,
    color: loginPalette.text,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  inputFocused: {
    borderColor: loginPalette.green,
    backgroundColor: loginPalette.navySoft,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 86,
  },
  visibilityButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  visibilityText: {
    color: loginPalette.green,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 2,
    marginBottom: 18,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: loginPalette.navyLine,
    backgroundColor: loginPalette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: loginPalette.green,
    backgroundColor: loginPalette.green,
  },
  checkboxMark: {
    color: loginPalette.greenDeep,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 15,
  },
  rememberText: {
    color: loginPalette.textMuted,
    fontSize: 12,
  },
  link: {
    color: loginPalette.greenLight,
    fontSize: 12,
    fontWeight: '600',
  },
  linkDisabled: {
    opacity: 0.5,
  },
  primaryButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: loginPalette.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: loginPalette.green,
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  primaryButtonPressed: {
    backgroundColor: loginPalette.green,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: loginPalette.greenDeep,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  buttonMuted: {
    opacity: 0.55,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(143, 168, 186, 0.16)',
  },
  dividerText: {
    color: loginPalette.textDim,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  googleButton: {
    height: 54,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: loginPalette.navyLine,
    backgroundColor: loginPalette.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonPressed: {
    backgroundColor: loginPalette.navySoft,
    borderColor: 'rgba(47, 214, 139, 0.4)',
  },
  googleMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: loginPalette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleMarkText: {
    color: '#1A73E8',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  googleButtonText: {
    color: loginPalette.text,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  footerText: {
    color: loginPalette.textMuted,
    fontSize: 13,
  },
  footerLink: {
    color: loginPalette.greenLight,
    fontSize: 13,
    fontWeight: '700',
  },
  legal: {
    marginTop: 18,
    paddingHorizontal: 12,
    color: loginPalette.textDim,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
});
