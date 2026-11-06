import LottieView from 'lottie-react-native';

export const animaciones = {
  changeanresetpassword: require('../../../assets/animations/ChangeAndResetPassword.json'),
  correct: require('../../../assets/animations/correct.json'),
  correctCredentials: require('../../../assets/animations/correctCredentials.json'),
  edit: require('../../../assets/animations/edit.json'),
  error: require('../../../assets/animations/error.json'),
  invalidCredentials: require('../../../assets/animations/invalidCredentials.json'),
  loginandlogout: require('../../../assets/animations/loginAndLogout.json'),
  newUser: require('../../../assets/animations/newUser.json'),
  tienda: require('../../../assets/animations/tienda.json'),
} as const;

export type AnimacionId = keyof typeof animaciones;

export function obtenerAnimacion(id: AnimacionId) {
  return animaciones[id];
}

export { LottieView };
