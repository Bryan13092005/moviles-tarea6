import { useAlert } from '@/features/alerts/AlertContext';
import type { AnimacionId } from '@/components/ui/animaciones';

export function useAlertSystem() {
  const { showAlert } = useAlert();

  const alertSuccess = (
    message: string,
    animation: AnimacionId = 'correct',
    duration = 3000,
    isFullScreen = false
  ) => {
    return showAlert({
      type: 'success',
      message,
      animation,
      duration,
      closable: isFullScreen,
      isFullScreen,
    });
  };

  const alertError = (
    message: string,
    animation: AnimacionId = 'error',
    duration = 3000,
    isFullScreen = false
  ) => {
    return showAlert({
      type: 'error',
      message,
      animation,
      duration,
      closable: isFullScreen,
      isFullScreen,
    });
  };

  const alertInfo = (
    message: string,
    animation: AnimacionId = 'tienda',
    duration = 3000,
    isFullScreen = false
  ) => {
    return showAlert({
      type: 'info',
      message,
      animation,
      duration,
      closable: isFullScreen,
      isFullScreen,
    });
  };

  const alertWarning = (
    message: string,
    animation: AnimacionId = 'invalidCredentials',
    duration = 3000,
    isFullScreen = false
  ) => {
    return showAlert({
      type: 'warning',
      message,
      animation,
      duration,
      closable: isFullScreen,
      isFullScreen,
    });
  };

  const showUserCreatedAlert = (isFullScreen = true) => {
    return alertSuccess('¡Cuenta creada exitosamente!\nBienvenido a nuestro marketplace', 'correct', 4000, isFullScreen);
  };

  const showLoginSuccessAlert = (isFullScreen = true) => {
    return alertSuccess('¡Has iniciado sesión!\nBienvenido de vuelta', 'correctCredentials', 4000, isFullScreen);
  };

  const showProductAddedAlert = (productName: string, isFullScreen = false) => {
    return alertSuccess(`${productName} agregado exitosamente`, 'correct', 3000, isFullScreen);
  };

  const showProductDeletedAlert = (productName: string, isFullScreen = false) => {
    return alertSuccess(`${productName} eliminado exitosamente`, 'correct', 3000, isFullScreen);
  };

  const showProductUpdatedAlert = (productName: string, isFullScreen = false) => {
    return alertSuccess(`${productName} actualizado exitosamente`, 'edit', 3000, isFullScreen);
  };

  const showPasswordResetAlert = (isFullScreen = true) => {
    return alertSuccess('Tu contraseña ha sido restablecida\nVerifica tu correo electrónico', 'changeanresetpassword', 4000, isFullScreen);
  };

  const showPasswordChangedAlert = (isFullScreen = true) => {
    return alertSuccess('Tu contraseña ha sido cambiada exitosamente', 'changeanresetpassword', 3500, isFullScreen);
  };

  const showInvalidCredentialsAlert = (message: string, isFullScreen = false) => {
    return alertWarning(message, 'invalidCredentials', 3500, isFullScreen);
  };

  const showEmailExistsAlert = (isFullScreen = false) => {
    return alertError('Este correo ya está registrado\nIntenta con otro o inicia sesión', 'error', 3500, isFullScreen);
  };

  const showAccountNotFoundAlert = (isFullScreen = false) => {
    return alertError('Cuenta no encontrada\nVerifica tu correo o crea una nueva cuenta', 'error', 3500, isFullScreen);
  };

  const showGenericErrorAlert = (message: string, isFullScreen = false) => {
    return alertError(message, 'error', 3500, isFullScreen);
  };

  const showLoadingAlert = (message: string = 'Cargando tienda...', isFullScreen = true) => {
    return showAlert({
      type: 'info',
      message,
      animation: 'tienda',
      closable: false,
      isFullScreen,
    });
  };

  return {
    alertSuccess,
    alertError,
    alertInfo,
    alertWarning,
    showUserCreatedAlert,
    showLoginSuccessAlert,
    showProductAddedAlert,
    showProductDeletedAlert,
    showProductUpdatedAlert,
    showPasswordResetAlert,
    showPasswordChangedAlert,
    showInvalidCredentialsAlert,
    showEmailExistsAlert,
    showAccountNotFoundAlert,
    showGenericErrorAlert,
    showLoadingAlert,
  };
}
