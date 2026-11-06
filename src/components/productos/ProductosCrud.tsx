import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';

import { deleteProducto, getProductos } from '@/api/api.services';
import { eliminarImagenProducto } from '@/api/storage.services';
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

import { LottieButton } from '@/components/ui/LottieButton';
import { obtenerAnimacion } from '@/components/ui/animaciones';
import LottieView from 'lottie-react-native';
import { useAlertSystem } from '@/features/alerts/useAlertSystem';

import { ProductoCard } from './ProductoCard';
import { ProductoForm } from './ProductoForm';
import { ProductoModal } from './ProductoModal';

const bottomPad = Platform.OS === 'ios' ? 24 : 14;

export function ProductosCrud() {
  const { alertSuccess, alertError, showProductAddedAlert, showProductDeletedAlert, showProductUpdatedAlert } = useAlertSystem();
  
  const [items, setItems] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getProductos();
      setItems(data);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'No se pudieron cargar los productos.';
      alertError(errorMsg, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [alertError]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const data = await getProductos();
        if (active) setItems(data);
      } catch (e) {
        if (active) {
          const errorMsg = e instanceof Error ? e.message : 'No se pudieron cargar los productos.';
          alertError(errorMsg, 'error');
        }
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
  }, [alertError]);

  const openCreate = () => setModal({ open: true, producto: null });
  const openEdit = (producto: Producto) => setModal({ open: true, producto });
  const closeModal = () => setModal({ open: false, producto: null });

  const openPasswordModal = () => {
    if (provider === 'google') {
      alertError('Las cuentas de Google no usan contraseña en esta app.', 'error');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordModal(true);
  };

  const handleSignOut = async () => {
    if (accountBusy) return;
    setAccountBusy('signout');
    try {
      await signOut(auth);
      router.replace('/');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'No se pudo cerrar sesión.';
      alertError(errorMsg, 'error');
    } finally {
      setAccountBusy(null);
    }
  };

  const handleChangePassword = async () => {
    if (accountBusy) return;

    if (newPassword.length < 6) {
      alertError('La nueva contraseña debe tener al menos 6 caracteres.', 'invalidCredentials');
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
      alertSuccess('Contraseña actualizada correctamente.', 'changeanresetpassword', 3000);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.';
      alertError(errorMsg, 'error');
    } finally {
      setAccountBusy(null);
    }
  };

  const onSaved = (saved: Producto, isNew: boolean = false) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [saved, ...prev];
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    closeModal();
    if (isNew) {
      showProductAddedAlert(saved.nombre ?? 'Producto', false);
    } else {
      showProductUpdatedAlert(saved.nombre ?? 'Producto', false);
    }
  };

  const confirmDelete = (producto: Producto) => {
    const title = 'Eliminar producto';
    const message = `¿Eliminar "${producto.nombre ?? 'este producto'}"? Esta acción no se puede deshacer.`;

    const run = async () => {
      setDeletingId(producto.id);
      try {
        await deleteProducto(producto.id);
        if (producto.img) {
          await eliminarImagenProducto(producto.img).catch(() => undefined);
        }
        setItems((prev) => prev.filter((p) => p.id !== producto.id));
        showProductDeletedAlert(producto.nombre ?? 'Producto', false);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'No se pudo eliminar el producto.';
        alertError(errorMsg, 'error');
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
      <View className="flex-row items-start justify-between gap-3 px-5 pt-4 pb-[14px]">
        <View className="flex-1">
          <Text className="text-[9px] font-extrabold tracking-[1.8px] text-[#A8F2C9]">CATÁLOGO</Text>
          <Text className="mt-[6px] text-[28px] font-extrabold tracking-[-0.8px] text-[#F2F8F5]">Productos</Text>
          <Text className="mt-[6px] text-[13px] leading-[18px] text-[#8FA8BA]">
            Gestiona tu inventario con imágenes en Supabase.
          </Text>
        </View>
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Agregar producto"
          className="min-h-[42px]"
        >
          {({ pressed }) => (
            <View
              className={`min-h-[42px] items-center justify-center rounded-[14px] px-[14px] ${
                pressed ? 'bg-[#2FD68B]' : 'bg-[#A8F2C9]'
              }`}
            >
              <Text className="text-[13px] font-extrabold text-[#072A1E]">+ Agregar</Text>
            </View>
          )}
        </Pressable>
      </View>
    ),
    [],
  );

  return (
    <View className="flex-1 bg-[#050F1A]" style={{ flex: 1, backgroundColor: '#050F1A' }}>
      {header}

      {loading ? (
        <View className="flex-1 items-center justify-center gap-[10px]">
          <LottieView
            source={obtenerAnimacion('tienda')}
            autoPlay
            loop
            style={{ width: 140, height: 140 }}
          />
          <Text className="text-[13px] text-[#8FA8BA]">Cargando productos…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, flexGrow: 1 }}
          renderItem={({ item, index }) => (
            <ProductoCard
              producto={item}
              onEdit={openEdit}
              onDelete={confirmDelete}
              busy={deletingId === item.id}
              index={index}
            />
          )}
          ItemSeparatorComponent={() => <View className="h-3" />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load('refresh')}
              tintColor="#A8F2C9"
            />
          }
          ListEmptyComponent={
            <View className="mt-10 items-center rounded-[20px] border border-[#183850] bg-[rgba(9,27,43,0.6)] p-5">
              <Text className="text-[16px] font-bold text-[#F2F8F5]">Sin productos</Text>
              <Text className="mt-[6px] text-center text-[13px] text-[#8FA8BA]">
                Usa “Agregar” para crear el primero.
              </Text>
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
        <View className="gap-2">
          <Text className="text-[9px] font-bold tracking-[1.6px] text-[#8FA8BA]">CONTRASEÑA ACTUAL</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Requerida si iniciaste con correo"
            placeholderTextColor="#5C7A90"
            className="min-h-[50px] rounded-[14px] border border-[#183850] bg-[#0C2236] px-[14px] text-[14px] text-[#F2F8F5]"
            secureTextEntry
            autoCapitalize="none"
            editable={accountBusy !== 'password'}
            selectionColor="#2FD68B"
            keyboardAppearance="dark"
          />
        </View>
        <View className="gap-2">
          <Text className="text-[9px] font-bold tracking-[1.6px] text-[#8FA8BA]">NUEVA CONTRASEÑA</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#5C7A90"
            className="min-h-[50px] rounded-[14px] border border-[#183850] bg-[#0C2236] px-[14px] text-[14px] text-[#F2F8F5]"
            secureTextEntry
            autoCapitalize="none"
            editable={accountBusy !== 'password'}
            selectionColor="#2FD68B"
            keyboardAppearance="dark"
          />
        </View>
        <View className="mt-1 flex-row gap-[10px]">
          <Pressable
            onPress={() => setPasswordModal(false)}
            disabled={accountBusy === 'password'}
            accessibilityRole="button"
            className="min-h-[48px]"
          >
            {({ pressed }) => (
              <View
                className={`min-h-[48px] items-center justify-center rounded-[14px] border border-[#183850] px-[14px] ${
                  pressed && accountBusy !== 'password' ? 'border-[rgba(47,214,139,0.4)]' : ''
                } ${accountBusy === 'password' ? 'opacity-[0.55]' : ''}`}
              >
                <Text className="text-[14px] font-semibold text-[#8FA8BA]">Cancelar</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={handleChangePassword}
            disabled={accountBusy === 'password'}
            accessibilityRole="button"
            accessibilityLabel="Guardar nueva contraseña"
            className="min-h-[48px] flex-1"
          >
            {({ pressed }) => (
              <View
                className={`min-h-[48px] flex-1 items-center justify-center rounded-[14px] px-[14px] ${
                  pressed && accountBusy !== 'password' ? 'bg-[#2FD68B]' : 'bg-[#A8F2C9]'
                } ${accountBusy === 'password' ? 'opacity-[0.55]' : ''}`}
              >
                {accountBusy === 'password' ? (
                  <ActivityIndicator color="#072A1E" />
                ) : (
                  <Text className="text-[14px] font-extrabold text-[#072A1E]">Guardar</Text>
                )}
              </View>
            )}
          </Pressable>
        </View>
      </ProductoModal>

      <View
        className="gap-[10px] border-t border-[rgba(143,168,186,0.12)] bg-[rgba(8,26,43,0.96)] px-5 pt-[10px]"
        style={{ paddingBottom: bottomPad }}
      >
        <View className="flex-row gap-[10px]">
          <Pressable
            onPress={openPasswordModal}
            disabled={accountBusy !== null || provider === 'google' || provider === null}
            accessibilityRole="button"
            accessibilityLabel="Cambiar contraseña"
            accessibilityState={{ disabled: accountBusy !== null || provider === 'google' || provider === null }}
            className="min-h-[48px] flex-1"
          >
            {({ pressed }) => {
              const disabled = accountBusy !== null || provider === 'google' || provider === null;
              return (
                <View
                  className={`min-h-[48px] flex-1 items-center justify-center rounded-[14px] border border-[#183850] bg-[#0C2236] px-3 ${
                    pressed && !disabled ? 'border-[rgba(47,214,139,0.4)]' : ''
                  } ${disabled ? 'opacity-[0.55]' : ''}`}
                >
                  <Text className="text-[13px] font-bold text-[#F2F8F5]">
                    {provider === 'google' ? 'Clave (Google)' : 'Cambiar clave'}
                  </Text>
                </View>
              );
            }}
          </Pressable>
          <LottieButton
            animation="loginandlogout"
            label={accountBusy === 'signout' ? 'Cerrando…' : 'Cerrar sesión'}
            onPress={handleSignOut}
            variant="peligro"
            busy={accountBusy === 'signout'}
            disabled={accountBusy !== null}
            className="min-h-[48px] flex-1"
          />
        </View>
      </View>
    </View>
  );
}
