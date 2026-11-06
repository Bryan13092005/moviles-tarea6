import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AnimacionId } from '@/components/ui/animaciones';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  animation: AnimacionId;
  duration?: number;
  closable?: boolean;
  isFullScreen?: boolean;
  onDismiss?: () => void;
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (alert: Omit<Alert, 'id'>) => string;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const showAlert = useCallback((alert: Omit<Alert, 'id'>) => {
    const id = Date.now().toString() + Math.random();
    const newAlert: Alert = { ...alert, id };

    setAlerts((prev) => [...prev, newAlert]);

    if (alert.duration) {
      setTimeout(() => {
        dismissAlert(id);
      }, alert.duration);
    }

    return id;
  }, [dismissAlert]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, showAlert, dismissAlert, clearAlerts }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe usarse dentro de AlertProvider');
  }
  return context;
}
