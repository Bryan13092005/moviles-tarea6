import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { deleteProducto, getProductos } from '@/api/api.services';
import { eliminarImagenProducto } from '@/api/storage.services';
import { palette } from '@/constants/theme';
import {
  auth,
  EmailAuthProvider,
  obtenerProveedorAutenticacion,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  type ProveedorAutenticacion,
} from '@/features/auth/supabaseAuth';
import type { Producto } from '@/features/productos/productos.types';

import { ProductoCard } from './ProductoCard';
import { ProductoForm } from './ProductoForm';
import { ProductoModal } from './ProductoModal';

export function ProductosCrud() {
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; producto: Producto | null }>({
    open: false,
    producto: null,
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ProveedorAutenticacion | null>(null);
  const [accountBusy, setAccountBusy] = useState<'signout' | 'password' | null>(null);
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountError, setAccountError] = useState<string | null>(null);
  const [accountNotice, setAccountNotice] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getProductos();
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setError(null);
      try {
        const data = await getProductos();
        if (active) setItems(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();

    void obtenerProveedorAutenticacion(auth).then((p) => {
      if (active) setProvider(p);
    });

    return () => {
      active = false;
    };
  }, []);

  const openCreate = () => setModal({ open: true, producto: null });
  const openEdit = (producto: Producto) => setModal({ open: true, producto });
  const closeModal = () => setModal({ open: false, producto: null });

  const openPasswordModal = () => {
    if (provider === 'google') {
      setAccountError('Las cuentas de Google no usan contraseña en esta app.');
      setAccountNotice(null);
      return;
    }
    setAccountError(null);
    setAccountNotice(null);
    setCurrentPassword('');
    setNewPassword('');
    setPasswordModal(true);
  };

  const handleSignOut = async () => {
    if (accountBusy) return;
    setAccountError(null);
    setAccountNotice(null);
    setAccountBusy('signout');
    try {
      await signOut(auth);
      router.replace('/');
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : 'No se pudo cerrar sesión.');
    } finally {
      setAccountBusy(null);
    }
  };

  const handleChangePassword = async () => {
    if (accountBusy) return;
    setAccountError(null);
    setAccountNotice(null);

    if (newPassword.length < 6) {
      setAccountError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setAccountBusy('password');
    try {
      const { data } = await auth.getUser();
      const user = data.user;
      if (!user) throw new Error('No hay una sesión activa.');

      if (user.email && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth, user, credential);
      }

      await updatePassword(auth, user, newPassword);
      setPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setAccountNotice('Contraseña actualizada correctamente.');
    } catch (e) {
      setAccountError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setAccountBusy(null);
    }
  };

  const onSaved = (saved: Producto) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    closeModal();
  };

  const confirmDelete = (producto: Producto) => {
    const title = 'Eliminar producto';
    const message = `¿Eliminar "${producto.nombre ?? 'este producto'}"? Esta acción no se puede deshacer.`;

    const run = async () => {
      setDeletingId(producto.id);
      setError(null);
      try {
        await deleteProducto(producto.id);
        if (producto.img) {
          await eliminarImagenProducto(producto.img).catch(() => undefined);
        }
        setItems((prev) => prev.filter((p) => p.id !== producto.id));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo eliminar el producto.');
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof globalThis.confirm === 'function' && globalThis.confirm(`${title}\n\n${message}`)) {
        void run();
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void run() },
    ]);
  };

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>CATÁLOGO</Text>
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>Gestiona tu inventario con imágenes en Supabase.</Text>
        </View>
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Agregar producto"
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        >
          <Text style={styles.addBtnText}>+ Agregar</Text>
        </Pressable>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.screen}>
      {header}

      {error ? (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.greenLight} />
          <Text style={styles.mutedText}>Cargando productos…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <ProductoCard
              producto={item}
              onEdit={openEdit}
              onDelete={confirmDelete}
              busy={deletingId === item.id}
              index={index}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor={palette.greenLight}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Sin productos</Text>
              <Text style={styles.emptyText}>Usa “Agregar” para crear el primero.</Text>
            </View>
          }
        />
      )}

      <ProductoModal
        visible={modal.open}
        title={modal.producto ? 'Actualizar producto' : 'Nuevo producto'}
        onClose={closeModal}
      >
        <ProductoForm producto={modal.producto} onSaved={onSaved} onCancel={closeModal} />
      </ProductoModal>
      <ProductoModal
        visible={passwordModal}
        title="Cambiar contraseña"
        onClose={() => setPasswordModal(false)}
      >
        {accountError ? (
          <View style={styles.accountBannerError} accessibilityLiveRegion="polite">
            <Text style={styles.accountBannerErrorText}>{accountError}</Text>
          </View>
        ) : null}
        <View style={styles.field}>
          <Text style={styles.label}>CONTRASEÑA ACTUAL</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Requerida si iniciaste con correo"
            placeholderTextColor={palette.textDim}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            editable={accountBusy !== 'password'}
            selectionColor={palette.green}
            keyboardAppearance="dark"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>NUEVA CONTRASEÑA</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={palette.textDim}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
            editable={accountBusy !== 'password'}
            selectionColor={palette.green}
            keyboardAppearance="dark"
          />
        </View>
        <View style={styles.accountActions}>
          <Pressable
            onPress={() => setPasswordModal(false)}
            disabled={accountBusy === 'password'}
            accessibilityRole="button"
            style={({ pressed }) => [styles.ghostBtn, pressed && accountBusy !== 'password' && styles.btnPressed, accountBusy === 'password' && styles.btnMuted]}
          >
            <Text style={styles.ghostBtnText}>Cancelar</Text>
          </Pressable>
          <Pressable
            onPress={handleChangePassword}
            disabled={accountBusy === 'password'}
            accessibilityRole="button"
            accessibilityLabel="Guardar nueva contraseña"
            style={({ pressed }) => [styles.primaryBtn, pressed && accountBusy !== 'password' && styles.primaryPressed, accountBusy === 'password' && styles.btnMuted]}
          >
            {accountBusy === 'password' ? (
              <ActivityIndicator color={palette.greenDeep} />
            ) : (
              <Text style={styles.primaryBtnText}>Guardar</Text>
            )}
          </Pressable>
        </View>
      </ProductoModal>

      <View style={styles.bottomBar}>
        {accountNotice ? (
          <View style={styles.accountBannerSuccess} accessibilityLiveRegion="polite">
            <Text style={styles.accountBannerSuccessText}>{accountNotice}</Text>
          </View>
        ) : null}
        {accountError && !passwordModal ? (
          <View style={styles.accountBannerError} accessibilityLiveRegion="polite">
            <Text style={styles.accountBannerErrorText}>{accountError}</Text>
          </View>
        ) : null}
        <View style={styles.bottomActions}>
          <Pressable
            onPress={openPasswordModal}
            disabled={accountBusy !== null || provider === 'google' || provider === null}
            accessibilityRole="button"
            accessibilityLabel="Cambiar contraseña"
            accessibilityState={{ disabled: accountBusy !== null || provider === 'google' || provider === null }}
            style={({ pressed }) => [
              styles.bottomBtn,
              styles.bottomBtnSecondary,
              pressed && !accountBusy && provider !== 'google' && provider !== null && styles.btnPressed,
              (accountBusy || provider === 'google' || provider === null) && styles.btnMuted,
            ]}
          >
            <Text style={styles.bottomBtnSecondaryText}>
              {provider === 'google' ? 'Clave (Google)' : 'Cambiar clave'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSignOut}
            disabled={accountBusy !== null}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={({ pressed }) => [styles.bottomBtn, styles.bottomBtnDanger, pressed && !accountBusy && styles.bottomBtnDangerPressed, accountBusy && styles.btnMuted]}
          >
            {accountBusy === 'signout' ? (
              <ActivityIndicator color={palette.danger} />
            ) : (
              <Text style={styles.bottomBtnDangerText}>Cerrar sesión</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerText: { flex: 1 },
  eyebrow: { color: palette.greenLight, fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  title: { marginTop: 6, color: palette.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { marginTop: 6, color: palette.textMuted, fontSize: 13, lineHeight: 18 },
  addBtn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: palette.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { backgroundColor: palette.green },
  addBtnText: { color: palette.greenDeep, fontSize: 13, fontWeight: '800' },
  banner: {
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 154, 0.32)',
    backgroundColor: palette.dangerBg,
  },
  bannerText: { color: palette.danger, fontSize: 12, lineHeight: 17 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mutedText: { color: palette.textMuted, fontSize: 13 },
  listContent: { paddingHorizontal: 20, paddingBottom: 12, flexGrow: 1 },
  separator: { height: 12 },
  empty: {
    marginTop: 40,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.navyLine,
    backgroundColor: 'rgba(9, 27, 43, 0.6)',
    alignItems: 'center',
  },
  emptyTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  emptyText: { marginTop: 6, color: palette.textMuted, fontSize: 13, textAlign: 'center' },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(143, 168, 186, 0.12)',
    backgroundColor: 'rgba(8, 26, 43, 0.96)',
    gap: 10,
  },
  bottomActions: { flexDirection: 'row', gap: 10 },
  bottomBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  bottomBtnSecondary: { borderColor: palette.navyLine, backgroundColor: palette.navySoft },
  bottomBtnSecondaryText: { color: palette.text, fontSize: 13, fontWeight: '700' },
  bottomBtnDanger: { borderColor: 'rgba(255, 154, 154, 0.28)', backgroundColor: 'rgba(52, 19, 28, 0.45)' },
  bottomBtnDangerPressed: { backgroundColor: palette.dangerBg },
  bottomBtnDangerText: { color: palette.danger, fontSize: 13, fontWeight: '700' },
  btnPressed: { borderColor: 'rgba(47, 214, 139, 0.4)' },
  btnMuted: { opacity: 0.55 },
  field: { gap: 8 },
  label: { color: palette.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.6 },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.navyLine,
    backgroundColor: palette.navySoft,
    color: palette.text,
    fontSize: 14,
  },
  accountActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  ghostBtn: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.navyLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: { color: palette.textMuted, fontSize: 14, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: palette.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: { backgroundColor: palette.green },
  primaryBtnText: { color: palette.greenDeep, fontSize: 14, fontWeight: '800' },
  accountBannerError: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 154, 154, 0.32)',
    backgroundColor: palette.dangerBg,
  },
  accountBannerErrorText: { color: palette.danger, fontSize: 12, lineHeight: 17 },
  accountBannerSuccess: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 139, 0.32)',
    backgroundColor: 'rgba(12, 59, 42, 0.75)',
  },
  accountBannerSuccessText: { color: palette.greenLight, fontSize: 12, lineHeight: 17 },
});
