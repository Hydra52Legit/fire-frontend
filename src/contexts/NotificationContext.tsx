import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import NotificationService, { NotificationPreference } from '../services/notificationService';

interface NotificationContextType {
  preferences: NotificationPreference;
  updatePreferences: (preferences: NotificationPreference) => Promise<void>;
  scheduleAllNotifications: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  isInitialized: boolean;
  availabilityInfo: {
    isExpoGo: boolean;
    isEmulator: boolean;
    isInitialized: boolean;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  // ИСПРАВЛЕНО: Установим начальное состояние как DEFAULT_PREFERENCES
  const [preferences, setPreferences] = useState<NotificationPreference>({
    pushEnabled: true,
    emailEnabled: false,
    daysBefore: [30, 14, 7, 3, 1],
    immediateAlerts: true,
    dailySummary: true,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [availabilityInfo, setAvailabilityInfo] = useState({
    isExpoGo: false,
    isEmulator: false,
    isInitialized: false,
  });

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      const initialized = await NotificationService.initialize();
      setIsInitialized(initialized);
      
      // Обновляем информацию о доступности
      const info = NotificationService.getAvailabilityInfo();
      setAvailabilityInfo(info);
      
      // Всегда загружаем настройки, даже если уведомления недоступны
      const savedPreferences = await NotificationService.getPreferences();
      setPreferences(savedPreferences);
    } catch (error: any) {
      // Игнорируем ошибки Expo Go - они не критичны
      if (!error?.message?.includes('Expo Go') && !error?.message?.includes('development build')) {
        // Только логируем реальные ошибки
        console.error('Ошибка инициализации уведомлений:', error);
      }
      
      // Обновляем информацию о доступности даже при ошибке
      const info = NotificationService.getAvailabilityInfo();
      setAvailabilityInfo(info);
      
      // Все равно загружаем настройки
      try {
        const savedPreferences = await NotificationService.getPreferences();
        setPreferences(savedPreferences);
      } catch (e) {
        // Игнорируем ошибки загрузки настроек
      }
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreference) => {
    try {
      await NotificationService.savePreferences(newPreferences);
      setPreferences(newPreferences);
      
      // Перепланируем уведомления при изменении настроек
      if (newPreferences.pushEnabled) {
        await NotificationService.scheduleAllNotifications();
      } else {
        await NotificationService.cancelAllNotifications();
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить настройки уведомлений');
    }
  };

  const scheduleAllNotifications = async () => {
    try {
      await NotificationService.scheduleAllNotifications();
      Alert.alert('Успех', 'Все уведомления запланированы');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось запланировать уведомления');
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await NotificationService.cancelAllNotifications();
      Alert.alert('Успех', 'Все уведомления отменены');
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось отменить уведомления');
    }
  };

  return (
    <NotificationContext.Provider value={{
      preferences,
      updatePreferences,
      scheduleAllNotifications,
      cancelAllNotifications,
      isInitialized,
      availabilityInfo,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}