import { View } from 'react-native';
import { LottieAlert } from './LottieAlert';
import { useAlert } from '@/features/alerts/AlertContext';

export function AlertContainer() {
  const { alerts, dismissAlert } = useAlert();

  const fullScreenAlert = alerts.find((alert) => alert.isFullScreen);
  const floatingAlerts = alerts.filter((alert) => !alert.isFullScreen);

  if (fullScreenAlert) {
    return (
      <LottieAlert
        visible={true}
        type={fullScreenAlert.type}
        message={fullScreenAlert.message}
        animation={fullScreenAlert.animation}
        closable={fullScreenAlert.closable}
        isFullScreen={true}
        onDismiss={() => {
          dismissAlert(fullScreenAlert.id);
          fullScreenAlert.onDismiss?.();
        }}
      />
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        transform: [{ translateY: -60 }],
        paddingTop: 12,
        paddingHorizontal: 0,
        zIndex: 999,
      }}
    >
      {floatingAlerts.map((alert) => (
        <LottieAlert
          key={alert.id}
          visible={true}
          type={alert.type}
          message={alert.message}
          animation={alert.animation}
          closable={alert.closable}
          isFullScreen={false}
          onDismiss={() => {
            dismissAlert(alert.id);
            alert.onDismiss?.();
          }}
        />
      ))}
    </View>
  );
}
